import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import multer from 'multer';
import xml2js from 'xml2js';
import { fileURLToPath } from 'url';
import GeoTIFF from 'geotiff';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, 'users.txt');
const shapesFilePath = path.join(__dirname, 'shapes.json'); // Shapes storage
const markersFilePath = path.join(__dirname, 'markers.json'); // Markers file storage
const app = express();
const port = 3000;

const JWT_SECRET = 'your_jwt_secret_key';

// File storage configuration for multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename file to avoid conflicts
  },
});

const upload = multer({ storage: storage });

// Ensure the 'uploads' directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Ensure the shapes.json file exists
if (!fs.existsSync(shapesFilePath)) {
  fs.writeFileSync(shapesFilePath, '[]');
}

// Ensure markers.json exists
if (!fs.existsSync(markersFilePath)) {
  fs.writeFileSync(markersFilePath, JSON.stringify([]));
}

app.use(cors());
app.use(bodyParser.json());

// Function to check if user credentials are correct
const checkUserInFile = (username, password) => {
  try {
    const fileData = fs.readFileSync(usersFilePath, 'utf-8');
    const users = fileData.split('\n').filter(Boolean);
    return users.some(user => {
      const [storedUsername, storedPassword] = user.split(',');
      return storedUsername === username && storedPassword === password;
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return false;
  }
};

// User registration route
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  try {
    const fileData = fs.existsSync(usersFilePath) ? fs.readFileSync(usersFilePath, 'utf-8') : '';
    if (fileData.split('\n').some(user => user.split(',')[0] === username)) {
      return res.status(400).json({ message: 'Username already exists!' });
    }
    fs.appendFileSync(usersFilePath, `${username},${password}\n`);
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'User registered successfully!', token });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration!' });
  }
});

// User login route
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (checkUserInFile(username, password)) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ message: 'Login successful!', token });
  }
  res.status(400).json({ message: 'Invalid credentials!' });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  console.log('Received file:', file);  // Log the file information
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Process the file
  parseFile(file, res);
});

// Function to parse the uploaded file based on its type
const parseFile = async (file, res) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.geojson') {
    fs.readFile(file.path, 'utf8', (err, data) => {
      if (err) return res.status(500).json({ error: 'Error reading the file' });

      try {
        const geojsonData = JSON.parse(data);
        console.log('Parsed GeoJSON Data:', geojsonData);  // Log the parsed GeoJSON
        if (!geojsonData.type || geojsonData.type !== 'FeatureCollection' || !Array.isArray(geojsonData.features)) {
          throw new Error('Invalid GeoJSON structure');
        }
        res.json({ type: 'geojson', data: geojsonData });
      } catch (err) {
        console.error('Error parsing GeoJSON:', err);
        res.status(400).json({ error: 'Invalid GeoJSON format' });
      }
    });
  } else if (ext === '.kml') {
    // Add parsing logic for KML files
    const parser = new xml2js.Parser();
    fs.readFile(file.path, 'utf8', (err, data) => {
      if (err) return res.status(500).json({ error: 'Error reading the KML file' });
      
      parser.parseString(data, (err, result) => {
        if (err) return res.status(400).json({ error: 'Invalid KML format' });
        console.log('Parsed KML Data:', result);  // Log the parsed KML
        res.json({ type: 'kml', data: result });
      });
    });
  } else {
    res.status(400).json({ error: 'Unsupported file format' });
  }
};



// Load shapes from file
app.get('/api/shapes', (req, res) => {
  fs.readFile(shapesFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading shapes file:', err);
      return res.status(500).json({ message: 'Failed to load shapes' });
    }

    try {
      // Parse the JSON data
      const shapes = JSON.parse(data);

      // Wrap the array of features in a FeatureCollection
      const featureCollection = {
        type: "FeatureCollection",
        features: shapes
      };

      res.status(200).json(featureCollection); // Send as FeatureCollection
    } catch (parseError) {
      console.error('Error parsing shapes data:', parseError);
      return res.status(500).json({ message: 'Error parsing shapes data' });
    }
  });
});

// Save new shapes to the file
app.post('/api/shapes', (req, res) => {
  try {
    const { shapes: newShapes } = req.body;

    // Check if newShapes is valid
    if (!newShapes || !Array.isArray(newShapes)) {
      return res.status(400).json({ message: 'Invalid shapes data' });
    }

    fs.writeFileSync(shapesFilePath, JSON.stringify(newShapes, null, 2));
    res.status(201).json({ message: 'Shapes saved successfully!' });
  } catch (error) {
    console.error('Error saving shapes:', error);
    res.status(500).json({ message: 'Failed to save shapes.' });
  }
});


// Edit an existing shape
app.put('/api/shapes/:id', (req, res) => {
  try {
    const shapeId = parseInt(req.params.id, 10);
    const { shapeData } = req.body;

    const shapesData = fs.readFileSync(shapesFilePath, 'utf8');
    const shapes = JSON.parse(shapesData);

    if (shapeId < 0 || shapeId >= shapes.length) {
      return res.status(404).json({ message: 'Shape not found.' });
    }

    shapes[shapeId] = shapeData;
    fs.writeFileSync(shapesFilePath, JSON.stringify(shapes, null, 2));

    res.status(200).json({ message: 'Shape updated successfully!' });
  } catch (error) {
    console.error('Error updating shape:', error);
    res.status(500).json({ message: 'Failed to update shape.' });
  }
});

// Delete a shape
app.delete('/api/shapes/:id', (req, res) => {
  const shapeId = req.params.id;

  fs.readFile(shapesFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading shapes file:', err);
      return res.status(500).json({ message: 'Failed to read shapes file' });
    }

    try {
      const shapes = JSON.parse(data);
      const shapeIndex = shapes.findIndex(shape => shape.id === shapeId);

      if (shapeIndex === -1) {
        return res.status(404).json({ message: 'Shape not found' });
      }

      // Remove the shape from the array
      shapes.splice(shapeIndex, 1);

      // Write the updated array back to the shapes file
      fs.writeFile(shapesFilePath, JSON.stringify(shapes, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Error writing updated shapes file:', writeErr);
          return res.status(500).json({ message: 'Failed to save updated shapes' });
        }

        res.status(200).json({ message: 'Shape deleted successfully' });
      });
    } catch (parseError) {
      console.error('Error parsing shapes data:', parseError);
      return res.status(500).json({ message: 'Error parsing shapes data' });
    }
  });
});

// Load markers
app.get("/api/markers", (req, res) => {
  const data = fs.readFileSync(markersFilePath, "utf8");
  const markers = JSON.parse(data);
  res.status(200).json(markers);
});

app.post("/api/markers", (req, res) => {
  const markers = req.body.markers || [];
  fs.writeFileSync(markersFilePath, JSON.stringify(markers, null, 2));
  res.status(201).json({ message: "Markers saved successfully!" });
});

// DELETE endpoint for deleting markers
app.delete('/api/markers/:id', (req, res) => {
  const markerId = req.params.id; // Assuming this is a unique identifier

  // Read the markers.json file
  fs.readFile(markersFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading markers file:', err);
      return res.status(500).json({ message: 'Error reading markers file' });
    }

    let markers;
    try {
      markers = JSON.parse(data); // Parse the markers.json file
    } catch (parseErr) {
      console.error('Error parsing markers file:', parseErr);
      return res.status(500).json({ message: 'Error parsing markers file' });
    }

    // Find the index of the marker with the specified ID
    const markerIndex = markers.findIndex(marker => marker.id === markerId);
    if (markerIndex === -1) {
      return res.status(404).json({ message: 'Marker not found!' });
    }

    // Remove the marker from the array
    markers.splice(markerIndex, 1);

    // Write the updated markers array back to the file
    fs.writeFile(markersFilePath, JSON.stringify(markers, null, 2), 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Error writing markers file:', writeErr);
        return res.status(500).json({ message: 'Error writing markers file' });
      }

      res.json({ message: 'Marker deleted successfully!' });
    });
  });
});

// Distance calculation route
app.post('/api/distance', (req, res) => {
  const { lat1, lon1, lat2, lon2 } = req.body;

  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return res.status(400).json({ error: 'All coordinates are required' });
  }

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const R = 6371; // Earth's radius in kilometers
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  res.json({ distance: distance.toFixed(2) });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
