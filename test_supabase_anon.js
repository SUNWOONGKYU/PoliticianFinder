// Test Supabase anon key access to project_grid_tasks_revised
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAccess() {
    console.log('Testing anon key access to project_grid_tasks_revised...\n');

    const { data, error, count } = await supabase
        .from('project_grid_tasks_revised')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('❌ ERROR:', error);
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
    } else {
        console.log('✅ SUCCESS!');
        console.log('Total rows:', count);
        console.log('First 3 tasks:');
        data.slice(0, 3).forEach(task => {
            console.log(`  - ${task.task_id}: ${task.task_name} (${task.status})`);
        });
    }
}

testAccess();
