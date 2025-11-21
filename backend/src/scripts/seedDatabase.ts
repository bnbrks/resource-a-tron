import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function seedDatabase() {
  console.log('Seeding database with sample data...');
  
  try {
    // Run the generateSampleData script
    const { stdout, stderr } = await execAsync('tsx src/scripts/generateSampleData.ts');
    
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
    
    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

