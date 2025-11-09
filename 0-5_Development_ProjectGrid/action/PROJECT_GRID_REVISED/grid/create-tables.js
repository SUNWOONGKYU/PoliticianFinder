// Create PROJECT_GRID_REVISED tables in Supabase
// Direct table creation using Supabase REST API

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

function executeSQL(sqlQuery) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sqlQuery });

    const options = {
      hostname: 'ooddlafwdpzgxfefgsrx.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function createTables() {
  console.log('🚀 Creating PROJECT_GRID_REVISED tables...\n');

  // Step 1: Create project_grid_tasks_revised table
  console.log('📋 Step 1: Creating project_grid_tasks_revised table...');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS project_grid_tasks_revised (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      phase INTEGER NOT NULL,
      area VARCHAR(10) NOT NULL,
      task_id VARCHAR(20) UNIQUE NOT NULL,
      task_name TEXT NOT NULL,
      instruction_file TEXT,
      assigned_agent VARCHAR(100),
      tools TEXT,
      work_mode VARCHAR(50) DEFAULT 'AI-Only',
      dependency_chain TEXT,
      progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      status VARCHAR(50) DEFAULT '대기',
      generated_files TEXT,
      generator VARCHAR(50),
      duration VARCHAR(50),
      modification_history TEXT,
      test_history TEXT,
      build_result VARCHAR(20) DEFAULT '⏳ 대기',
      dependency_propagation VARCHAR(50) DEFAULT '⏳ 대기',
      blocker TEXT DEFAULT '없음',
      validation_result TEXT DEFAULT '⏳ 대기',
      phase_gate_criteria TEXT,
      remarks TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    await executeSQL(createTableSQL);
    console.log('✅ Table created successfully\n');
  } catch (error) {
    console.log('ℹ️  Table might already exist or created:', error.message, '\n');
  }

  // Step 2: Create indexes
  console.log('📑 Step 2: Creating indexes...');
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_revised_task_id ON project_grid_tasks_revised(task_id);',
    'CREATE INDEX IF NOT EXISTS idx_revised_phase ON project_grid_tasks_revised(phase);',
    'CREATE INDEX IF NOT EXISTS idx_revised_area ON project_grid_tasks_revised(area);',
    'CREATE INDEX IF NOT EXISTS idx_revised_status ON project_grid_tasks_revised(status);'
  ];

  for (const indexSQL of indexes) {
    try {
      await executeSQL(indexSQL);
      console.log('  ✅ Index created');
    } catch (error) {
      console.log('  ℹ️  Index might already exist:', error.message);
    }
  }
  console.log();

  // Step 3: Create phase_gates table
  console.log('📋 Step 3: Creating phase_gates table...');

  const createPhaseGatesSQL = `
    CREATE TABLE IF NOT EXISTS phase_gates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      phase INTEGER UNIQUE NOT NULL,
      gate_name TEXT NOT NULL,
      criteria TEXT NOT NULL,
      status VARCHAR(20) DEFAULT '대기',
      verified_at TIMESTAMPTZ,
      verified_by TEXT,
      verification_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    await executeSQL(createPhaseGatesSQL);
    console.log('✅ Phase gates table created successfully\n');
  } catch (error) {
    console.log('ℹ️  Table might already exist:', error.message, '\n');
  }

  console.log('🎉 Table creation complete!\n');
  console.log('Next: Run insert-data.js to populate tables with data');
}

createTables().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
