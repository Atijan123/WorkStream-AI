const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { exec } = require('child_process');
const yaml = require('js-yaml');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, Excel, and JSON files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// System logs buffer
let systemLogs = [];
const MAX_LOGS = 1000;

// Helper function to add system log
function addSystemLog(level, message, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata
  };
  
  systemLogs.unshift(logEntry);
  if (systemLogs.length > MAX_LOGS) {
    systemLogs = systemLogs.slice(0, MAX_LOGS);
  }
  
  console.log(`[${level.toUpperCase()}] ${message}`, metadata);
}

// Helper function to load spec.yaml
async function loadSpec() {
  try {
    const specPath = path.join(__dirname, '.kiro', 'spec.yaml');
    const specContent = await fs.readFile(specPath, 'utf-8');
    return yaml.load(specContent);
  } catch (error) {
    addSystemLog('error', 'Failed to load spec.yaml', { error: error.message });
    throw new Error(`Failed to load spec.yaml: ${error.message}`);
  }
}

// Helper function to save spec.yaml
async function saveSpec(spec) {
  try {
    const specPath = path.join(__dirname, '.kiro', 'spec.yaml');
    const yamlContent = yaml.dump(spec, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
    
    // Ensure .kiro directory exists
    await fs.mkdir(path.dirname(specPath), { recursive: true });
    await fs.writeFile(specPath, yamlContent, 'utf-8');
    
    addSystemLog('info', 'Successfully updated spec.yaml');
    return true;
  } catch (error) {
    addSystemLog('error', 'Failed to save spec.yaml', { error: error.message });
    throw new Error(`Failed to save spec.yaml: ${error.message}`);
  }
}

// Helper function to run kiro generate
function runKiroGenerate() {
  return new Promise((resolve, reject) => {
    console.log('Executing: kiro generate');
    console.log('Working directory:', __dirname);
    
    addSystemLog('info', 'Starting kiro generate process');
    
    exec('kiro generate', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.log('Kiro generate process failed:');
        console.log('Error:', error.message);
        console.log('Stderr:', stderr.toString());
        
        addSystemLog('error', 'Kiro generate failed', { 
          error: error.message, 
          stderr: stderr.toString() 
        });
        reject(new Error(`Kiro generate failed: ${error.message}`));
        return;
      }
      
      console.log('Kiro generate process completed:');
      console.log('Stdout:', stdout.toString());
      if (stderr) {
        console.log('Stderr:', stderr.toString());
      }
      
      addSystemLog('info', 'Kiro generate completed successfully', { 
        stdout: stdout.toString(),
        stderr: stderr.toString()
      });
      resolve(stdout.toString());
    });
  });
}

// Helper function to generate unique ID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Routes

/**
 * POST /api/features/request
 * Takes { description }, logs the request, writes to .kiro/spec.yaml, and triggers kiro generate
 */
app.post('/api/features/request', async (req, res) => {
  try {
    const { description } = req.body;
    
    // Log the incoming request text to console
    console.log('=== FEATURE REQUEST RECEIVED ===');
    console.log('Request text:', description);
    console.log('Timestamp:', new Date().toISOString());
    console.log('================================');
    
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      console.log('ERROR: Invalid feature request - missing or empty description');
      return res.status(400).json({
        success: false,
        message: 'Feature request description is required and must be a non-empty string'
      });
    }
    
    addSystemLog('info', 'Processing new feature request', { description });
    
    // Load current spec
    let spec;
    try {
      spec = await loadSpec();
      console.log('SUCCESS: Loaded existing spec.yaml');
    } catch (error) {
      console.log('ERROR: Failed to load spec.yaml:', error.message);
      throw error;
    }
    
    // Generate feature name from description
    const featureName = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    
    const featureId = `feature_${generateId()}`;
    
    // Add new feature to spec
    if (!spec.features) {
      spec.features = {};
    }
    
    spec.features[featureId] = {
      name: featureName,
      description: description.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
      type: 'user_requested'
    };
    
    // Write the request into .kiro/spec.yaml
    try {
      await saveSpec(spec);
      console.log('SUCCESS: Written feature request to .kiro/spec.yaml');
      console.log('Feature ID:', featureId);
      console.log('Feature Name:', featureName);
    } catch (error) {
      console.log('ERROR: Failed to write to spec.yaml:', error.message);
      throw error;
    }
    
    // Automatically trigger regeneration using kiro generate
    console.log('=== STARTING KIRO GENERATE ===');
    try {
      const generateOutput = await runKiroGenerate();
      
      // Update feature status to completed
      spec.features[featureId].status = 'completed';
      spec.features[featureId].completed_at = new Date().toISOString();
      await saveSpec(spec);
      
      console.log('SUCCESS: Kiro generate completed successfully');
      console.log('Generate output:', generateOutput);
      console.log('==============================');
      
      addSystemLog('info', 'Feature request processed successfully', { 
        featureId, 
        featureName 
      });
      
      res.json({
        success: true,
        message: `Feature "${featureName}" has been successfully added and generated`,
        featureId,
        featureName,
        generateOutput: generateOutput.substring(0, 1000) // Show more output
      });
      
    } catch (generateError) {
      console.log('ERROR: Kiro generate failed:', generateError.message);
      console.log('==============================');
      
      // Update feature status to failed
      spec.features[featureId].status = 'failed';
      spec.features[featureId].error = generateError.message;
      await saveSpec(spec);
      
      throw generateError;
    }
    
  } catch (error) {
    console.log('ERROR: Feature request processing failed:', error.message);
    addSystemLog('error', 'Feature request processing failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/workflows
 * Takes { name, description, schedule, action }, appends it under workflows in .kiro/spec.yaml
 */
app.post('/api/workflows', async (req, res) => {
  try {
    const { name, description, schedule, action } = req.body;
    
    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }
    
    addSystemLog('info', 'Creating new workflow', { name, description });
    
    // Load current spec
    const spec = await loadSpec();
    
    // Generate workflow ID
    const workflowId = `workflow_${generateId()}`;
    
    // Create workflow object
    const workflow = {
      id: workflowId,
      name: name.trim(),
      description: description.trim(),
      created_at: new Date().toISOString(),
      status: 'active'
    };
    
    // Add trigger if schedule is provided
    if (schedule) {
      workflow.trigger = {
        type: 'schedule',
        schedule: schedule.trim()
      };
    } else {
      workflow.trigger = {
        type: 'manual'
      };
    }
    
    // Add actions
    if (action) {
      if (typeof action === 'string') {
        workflow.actions = [{
          type: 'custom',
          action: action.trim()
        }];
      } else if (Array.isArray(action)) {
        workflow.actions = action;
      } else if (typeof action === 'object') {
        workflow.actions = [action];
      }
    } else {
      workflow.actions = [{
        type: 'placeholder',
        action: 'No action specified'
      }];
    }
    
    // Add workflow to spec
    if (!spec.workflows) {
      spec.workflows = [];
    }
    
    spec.workflows.push(workflow);
    
    // Save updated spec
    await saveSpec(spec);
    
    // Trigger kiro generate to update the system
    try {
      const generateOutput = await runKiroGenerate();
      
      addSystemLog('info', 'Workflow created successfully', { 
        workflowId, 
        name 
      });
      
      res.json({
        success: true,
        message: `Workflow "${name}" has been successfully created`,
        workflowId,
        workflow,
        generateOutput: generateOutput.substring(0, 500)
      });
      
    } catch (generateError) {
      addSystemLog('error', 'Workflow generation failed', { 
        workflowId, 
        error: generateError.message 
      });
      
      // Don't remove the workflow, just log the error
      res.json({
        success: true,
        message: `Workflow "${name}" has been created but code generation failed: ${generateError.message}`,
        workflowId,
        workflow,
        warning: 'Code generation failed'
      });
    }
    
  } catch (error) {
    addSystemLog('error', 'Workflow creation failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/data/upload
 * Allow CSV/Excel upload, store file in /uploads/, and register path in spec if needed
 */
app.post('/api/data/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const { description, dataType } = req.body;
    
    addSystemLog('info', 'Processing file upload', { 
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size
    });
    
    // Load current spec
    const spec = await loadSpec();
    
    // Create data source entry
    const dataSourceId = `data_${generateId()}`;
    const relativePath = path.relative(__dirname, req.file.path);
    
    const dataSource = {
      id: dataSourceId,
      name: path.basename(req.file.originalname, path.extname(req.file.originalname)),
      description: description || `Uploaded file: ${req.file.originalname}`,
      type: dataType || 'file',
      path: relativePath,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploaded_at: new Date().toISOString()
    };
    
    // Add data source to spec
    if (!spec.data_sources) {
      spec.data_sources = [];
    }
    
    spec.data_sources.push(dataSource);
    
    // Save updated spec
    await saveSpec(spec);
    
    addSystemLog('info', 'File uploaded and registered successfully', { 
      dataSourceId,
      filename: req.file.filename
    });
    
    res.json({
      success: true,
      message: `File "${req.file.originalname}" uploaded successfully`,
      dataSourceId,
      dataSource,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: relativePath
      }
    });
    
  } catch (error) {
    addSystemLog('error', 'File upload failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/logs
 * Return recent system logs from memory buffer
 */
app.get('/api/logs', (req, res) => {
  try {
    const { limit = 100, level } = req.query;
    
    let logs = systemLogs;
    
    // Filter by level if specified
    if (level) {
      logs = logs.filter(log => log.level === level.toLowerCase());
    }
    
    // Limit results
    const limitNum = parseInt(limit, 10) || 100;
    logs = logs.slice(0, Math.min(limitNum, logs.length));
    
    res.json({
      success: true,
      logs,
      total: systemLogs.length,
      filtered: logs.length
    });
    
  } catch (error) {
    addSystemLog('error', 'Failed to retrieve logs', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/spec
 * Return current spec.yaml content
 */
app.get('/api/spec', async (req, res) => {
  try {
    const spec = await loadSpec();
    res.json({
      success: true,
      spec
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    logs_count: systemLogs.length
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  addSystemLog('error', 'Unhandled error', { 
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Start server
app.listen(PORT, () => {
  addSystemLog('info', `Self-Evolving Application Server started on port ${PORT}`);
  console.log(`🚀 Self-Evolving Application Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Logs: http://localhost:${PORT}/api/logs`);
  console.log(`📄 Spec: http://localhost:${PORT}/api/spec`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  addSystemLog('info', 'Server shutting down gracefully');
  console.log('\n🛑 Server shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  addSystemLog('info', 'Server terminated');
  console.log('\n🛑 Server terminated');
  process.exit(0);
});

module.exports = app;