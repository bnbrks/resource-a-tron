import { PrismaClient } from '@prisma/client';

// Use string literals for enums to avoid import issues during build
type UserRole = 'ADMIN' | 'MANAGER' | 'TEAM_MEMBER';
type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
type TaskType = 'PROJECT' | 'TRAINING' | 'PTO' | 'OTHER';
type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Insurance Advisory domain skills
const INSURANCE_SKILLS = [
  'Actuarial Analysis',
  'Risk Assessment',
  'Underwriting',
  'Claims Management',
  'Reinsurance',
  'Solvency II',
  'IFRS 17',
  'Reserve Analysis',
  'Capital Modeling',
  'Stress Testing',
  'Regulatory Compliance',
  'Product Development',
  'Pricing Strategy',
  'Data Analytics',
  'Python',
  'SQL',
  'Excel Advanced',
  'Project Management',
  'Client Relations',
  'Presentation Skills',
];

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
  'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Jason', 'Rebecca', 'Edward', 'Sharon',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
  'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
  'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
];

const PROJECT_NAMES = [
  'Solvency II Implementation',
  'IFRS 17 Transition Project',
  'Reserve Review - Q4 2024',
  'Capital Adequacy Assessment',
  'Product Portfolio Analysis',
  'Risk Model Validation',
  'Regulatory Reporting Enhancement',
  'Claims Process Optimization',
  'Underwriting System Upgrade',
  'Reinsurance Program Review',
  'Stress Testing Framework',
  'Data Quality Improvement',
  'Client Onboarding System',
  'Compliance Audit Preparation',
  'Pricing Model Development',
  'Actuarial Valuation',
  'Market Analysis Study',
  'Technology Infrastructure',
];

const CLIENTS = [
  'Global Insurance Group',
  'Metropolitan Life',
  'Pacific Assurance',
  'Continental Re',
  'Atlantic Underwriters',
  'Premier Insurance Co',
  'Heritage Insurance',
  'Summit Reinsurance',
];

async function generateUsers() {
  console.log('Generating users...');
  const users = [];

  for (let i = 0; i < 50; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@moodys.com`;
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const role: UserRole = i < 2 ? 'ADMIN' :
                 i < 10 ? 'MANAGER' :
                 'TEAM_MEMBER';

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        developmentAreas: [
          'Leadership Development',
          'Technical Skills',
          'Client Management',
        ].slice(0, Math.floor(Math.random() * 3) + 1),
      },
    });

    // Add skills
    const numSkills = Math.floor(Math.random() * 8) + 3; // 3-10 skills
    const selectedSkills = [...INSURANCE_SKILLS]
      .sort(() => Math.random() - 0.5)
      .slice(0, numSkills);

    for (const skillName of selectedSkills) {
      const proficiencyLevels = Object.values(ProficiencyLevel);
      const level = proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)];
      const certified = Math.random() > 0.7; // 30% certified

      await prisma.userSkill.create({
        data: {
          userId: user.id,
          skillName,
          proficiencyLevel: level,
          certified,
        },
      });
    }

    users.push(user);
  }

  console.log(`Generated ${users.length} users`);
  return users;
}

async function generateProjects(users: any[]) {
  console.log('Generating projects...');
  const projects = [];
  const statuses: ProjectStatus[] = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

  for (let i = 0; i < 18; i++) {
    const name = PROJECT_NAMES[i] || `Project ${i + 1}`;
    const client = CLIENTS[Math.floor(Math.random() * CLIENTS.length)];
    const status: ProjectStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 180)); // Last 6 months
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 180) + 30); // 30-210 days duration

    const budgetHours = Math.floor(Math.random() * 2000) + 500; // 500-2500 hours

    const project = await prisma.project.create({
      data: {
        name,
        description: `Comprehensive ${name.toLowerCase()} initiative for ${client}`,
        client,
        status,
        startDate,
        endDate,
        budgetHours,
      },
    });

    // Add requirements
    const numRequirements = Math.floor(Math.random() * 5) + 2; // 2-6 requirements
    const selectedSkills = [...INSURANCE_SKILLS]
      .sort(() => Math.random() - 0.5)
      .slice(0, numRequirements);

    for (let j = 0; j < selectedSkills.length; j++) {
      const proficiencyLevels: ProficiencyLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
      const level: ProficiencyLevel = proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length) + 1] || 'INTERMEDIATE';

      await prisma.projectRequirement.create({
        data: {
          projectId: project.id,
          skillName: selectedSkills[j],
          requiredLevel: level,
          priority: j + 1,
        },
      });
    }

    projects.push(project);
  }

  console.log(`Generated ${projects.length} projects`);
  return projects;
}

async function generateTasks(projects: any[]) {
  console.log('Generating tasks...');
  const tasks = [];
  const taskTypes = Object.values(TaskType);

  // Project tasks
  for (const project of projects) {
    const numTasks = Math.floor(Math.random() * 5) + 2; // 2-6 tasks per project
    for (let i = 0; i < numTasks; i++) {
      const task = await prisma.task.create({
        data: {
          name: `Task ${i + 1} for ${project.name}`,
          description: `Detailed work item for ${project.name}`,
          type: 'PROJECT' as TaskType,
          projectId: project.id,
          startDate: project.startDate,
          endDate: project.endDate,
        },
      });
      tasks.push(task);
    }
  }

  // Training tasks
  for (let i = 0; i < 8; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);

    const task = await prisma.task.create({
      data: {
        name: `Training: ${INSURANCE_SKILLS[Math.floor(Math.random() * INSURANCE_SKILLS.length)]}`,
        description: 'Professional development training session',
        type: 'TRAINING' as TaskType,
        startDate,
        endDate,
      },
    });
    tasks.push(task);
  }

  // PTO tasks
  for (let i = 0; i < 15; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 90));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 10) + 1);

    const task = await prisma.task.create({
      data: {
        name: `PTO - ${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]}`,
        description: 'Paid time off',
        type: 'PTO' as TaskType,
        startDate,
        endDate,
      },
    });
    tasks.push(task);
  }

  // Other tasks
  for (let i = 0; i < 5; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);

    const task = await prisma.task.create({
      data: {
        name: `Other Activity ${i + 1}`,
        description: 'Miscellaneous team activity',
        type: 'OTHER' as TaskType,
        startDate,
        endDate,
      },
    });
    tasks.push(task);
  }

  console.log(`Generated ${tasks.length} tasks`);
  return tasks;
}

async function generateAllocations(users: any[], tasks: any[]) {
  console.log('Generating allocations...');
  let allocationCount = 0;

  // Allocate users to project tasks
  const projectTasks = tasks.filter((t: { type: TaskType }) => t.type === 'PROJECT');
  
  for (const task of projectTasks) {
    const numAllocations = Math.floor(Math.random() * 3) + 1; // 1-3 users per task
    const selectedUsers = [...users]
      .sort(() => Math.random() - 0.5)
      .slice(0, numAllocations);

    for (const user of selectedUsers) {
      const allocatedHours = Math.random() * 30 + 10; // 10-40 hours/week
      const startDate = task.startDate || new Date();
      const endDate = task.endDate || null;

      await prisma.allocation.create({
        data: {
          userId: user.id,
          taskId: task.id,
          projectId: task.projectId,
          allocatedHours,
          startDate,
          endDate,
        },
      });
      allocationCount++;
    }
  }

  // Allocate users to training
  const trainingTasks = tasks.filter((t: { type: TaskType }) => t.type === 'TRAINING');
  for (const task of trainingTasks) {
    const numAllocations = Math.floor(Math.random() * 5) + 3; // 3-7 users per training
    const selectedUsers = [...users]
      .sort(() => Math.random() - 0.5)
      .slice(0, numAllocations);

    for (const user of selectedUsers) {
      await prisma.allocation.create({
        data: {
          userId: user.id,
          taskId: task.id,
          allocatedHours: 8, // Full day training
          startDate: task.startDate || new Date(),
          endDate: task.endDate || null,
        },
      });
      allocationCount++;
    }
  }

  console.log(`Generated ${allocationCount} allocations`);
}

async function generateTimeEntries(users: any[], tasks: any[]) {
  console.log('Generating time entries...');
  let entryCount = 0;

  // Generate entries for last 6 months
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  const projectTasks = tasks.filter((t: { type: TaskType }) => t.type === 'PROJECT');
  
  for (let day = 0; day < 180; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);

    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;

    // Generate entries for some users each day
    const usersToLog = [...users]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 20) + 10); // 10-30 users per day

    for (const user of usersToLog) {
      // Find user's allocations for this date
      const userAllocations = await prisma.allocation.findMany({
        where: {
          userId: user.id,
          OR: [
            {
              AND: [
                { startDate: { lte: currentDate } },
                {
                  OR: [
                    { endDate: { gte: currentDate } },
                    { endDate: null },
                  ],
                },
              ],
            },
          ],
        },
        include: {
          task: true,
        },
      });

      // Log time for some allocations
      for (const allocation of userAllocations) {
        if (Math.random() > 0.3) { // 70% chance to log time
          const hours = allocation.allocatedHours / 5 + (Math.random() - 0.5) * 2; // Some variance
          const clampedHours = Math.max(0.25, Math.min(8, hours));

          try {
            await prisma.timeEntry.create({
              data: {
                userId: user.id,
                taskId: allocation.taskId,
                date: currentDate,
                hours: Math.round(clampedHours * 4) / 4, // Round to 0.25
                description: `Work on ${allocation.task.name}`,
              },
            });
            entryCount++;
          } catch (error) {
            // Skip if entry already exists
          }
        }
      }
    }
  }

  console.log(`Generated ${entryCount} time entries`);
}

async function main() {
  console.log('Starting sample data generation...');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    // await prisma.timeEntry.deleteMany();
    // await prisma.allocation.deleteMany();
    // await prisma.task.deleteMany();
    // await prisma.projectRequirement.deleteMany();
    // await prisma.project.deleteMany();
    // await prisma.userSkill.deleteMany();
    // await prisma.user.deleteMany();

    const users = await generateUsers();
    const projects = await generateProjects(users);
    const tasks = await generateTasks(projects);
    await generateAllocations(users, tasks);
    await generateTimeEntries(users, tasks);

    console.log('Sample data generation completed!');
    console.log(`\nSummary:`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Projects: ${projects.length}`);
    console.log(`- Tasks: ${tasks.length}`);
    console.log(`\nDefault login credentials:`);
    console.log(`Email: ${users[0].email}`);
    console.log(`Password: password123`);
  } catch (error) {
    console.error('Error generating sample data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

