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
  const passwordHash = await bcrypt.hash('password123', 10);

  // Get or create team roles first
  const teamRoles = await prisma.teamRole.findMany();
  if (teamRoles.length === 0) {
    console.log('No team roles found. Please run basic seed first (npm run seed)');
    throw new Error('Team roles must exist before generating sample data');
  }

  for (let i = 0; i < 150; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@moodys.com`;
    const role: UserRole = i < 3 ? 'ADMIN' :
                 i < 25 ? 'MANAGER' :
                 'TEAM_MEMBER';

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        department: ['Risk Advisory', 'Actuarial', 'Compliance', 'IT', 'Operations'][Math.floor(Math.random() * 5)],
        profile: {
          create: {},
        },
      },
    });

    // Assign team roles to users (most users have 1-2 roles)
    const numRoles = Math.random() > 0.7 ? 2 : 1; // 30% have 2 roles
    const selectedRoles = [...teamRoles]
      .sort(() => Math.random() - 0.5)
      .slice(0, numRoles);
    
    for (let roleIdx = 0; roleIdx < selectedRoles.length; roleIdx++) {
      const role = selectedRoles[roleIdx];
      await prisma.userTeamRole.create({
        data: {
          userId: user.id,
          teamRoleId: role.id,
          isCurrent: roleIdx === 0, // First role is current
          startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in past year
        },
      });
    }

    // Add skills
    const numSkills = Math.floor(Math.random() * 8) + 3; // 3-10 skills
    const selectedSkills = [...INSURANCE_SKILLS]
      .sort(() => Math.random() - 0.5)
      .slice(0, numSkills);

    for (const skillName of selectedSkills) {
      const proficiencyLevels: ProficiencyLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
      const level: ProficiencyLevel = proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)];
      const certified = Math.random() > 0.7; // 30% certified

      // First, find or create the skill
      let skill = await prisma.skill.findUnique({
        where: { name: skillName },
      });
      
      if (!skill) {
        skill = await prisma.skill.create({
          data: {
            name: skillName,
            category: 'Technical',
          },
        });
      }
      
      await prisma.userSkill.create({
        data: {
          userId: user.id,
          skillId: skill.id,
          proficiencyLevel: level === 'BEGINNER' ? 1 : level === 'INTERMEDIATE' ? 2 : level === 'ADVANCED' ? 3 : 4,
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
  const teamRoles = await prisma.teamRole.findMany();

  // Generate more projects
  const totalProjects = 50;
  for (let i = 0; i < totalProjects; i++) {
    const name = PROJECT_NAMES[i] || `Project ${i + 1}`;
    const client = CLIENTS[Math.floor(Math.random() * CLIENTS.length)];
    const status: ProjectStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 180)); // Last 6 months
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 180) + 30); // 30-210 days duration

    const budgetHours = Math.floor(Math.random() * 2000) + 500; // 500-2500 hours

    const project = await prisma.activity.create({
      data: {
        name,
        description: `Comprehensive ${name.toLowerCase()} initiative for ${client}. This project involves detailed analysis, risk assessment, and compliance review.`,
        type: 'PROJECT',
        status: status as any,
        startDate,
        endDate,
        budgetHours: parseFloat(budgetHours.toString()),
      },
    });

    // Create activity scopes with team role requirements
    const numRequiredRoles = Math.floor(Math.random() * 4) + 1; // 1-4 roles per project
    const selectedRoles = [...teamRoles]
      .sort(() => Math.random() - 0.5)
      .slice(0, numRequiredRoles);
    
    for (const role of selectedRoles) {
      const requiredHours = Math.floor(Math.random() * 500) + 100; // 100-600 hours per role
      await prisma.activityScope.create({
        data: {
          activityId: project.id,
          teamRoleId: role.id,
          requiredHours: parseFloat(requiredHours.toString()),
          priority: ['HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 3)] as any,
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
  const taskTypes: TaskType[] = ['PROJECT', 'TRAINING', 'PTO', 'OTHER'];

  // Project tasks
  for (const project of projects) {
    const numTasks = Math.floor(Math.random() * 8) + 4; // 4-11 tasks per project
    const taskNames = [
      'Requirements Analysis',
      'Design & Planning',
      'Data Collection',
      'Analysis & Modeling',
      'Testing & Validation',
      'Documentation',
      'Review & Approval',
      'Implementation',
      'Quality Assurance',
      'Client Presentation',
      'Follow-up & Support',
    ];
    for (let i = 0; i < numTasks; i++) {
      const taskName = taskNames[i] || `Task ${i + 1} for ${project.name}`;
      const taskStartDate = new Date(project.startDate);
      taskStartDate.setDate(taskStartDate.getDate() + (i * 7)); // Stagger tasks weekly
      const taskEndDate = new Date(taskStartDate);
      taskEndDate.setDate(taskEndDate.getDate() + Math.floor(Math.random() * 14) + 7); // 1-3 weeks duration
      
      const task = await prisma.activity.create({
        data: {
          name: `${taskName} - ${project.name}`,
          description: `Detailed work item: ${taskName} for ${project.name}`,
          type: 'PROJECT',
          startDate: taskStartDate,
          endDate: taskEndDate < project.endDate ? taskEndDate : project.endDate,
        },
      });
      tasks.push(task);
    }
  }

  // Training tasks
  for (let i = 0; i < 25; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);

    const task = await prisma.activity.create({
      data: {
        name: `Training: ${INSURANCE_SKILLS[Math.floor(Math.random() * INSURANCE_SKILLS.length)]}`,
        description: 'Professional development training session',
        type: 'INTERNAL',
        startDate,
        endDate,
      },
    });
    tasks.push(task);
  }

  // PTO tasks
  for (let i = 0; i < 40; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 90));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 10) + 1);

    const task = await prisma.activity.create({
      data: {
        name: `PTO - ${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]}`,
        description: 'Paid time off',
        type: 'PTO',
        startDate,
        endDate,
      },
    });
    tasks.push(task);
  }

  // Other tasks
  for (let i = 0; i < 15; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);

    const task = await prisma.activity.create({
      data: {
        name: `Other Activity ${i + 1}`,
        description: 'Miscellaneous team activity',
        type: 'NON_BILLABLE',
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
  const projectTasks = tasks.filter((t: { type: string }) => t.type === 'PROJECT');
  
  for (const task of projectTasks) {
    const numAllocations = Math.floor(Math.random() * 5) + 2; // 2-6 users per task
    const selectedUsers = [...users]
      .sort(() => Math.random() - 0.5)
      .slice(0, numAllocations);

    for (const user of selectedUsers) {
      const allocatedHours = Math.random() * 30 + 10; // 10-40 hours/week
      const startDate = task.startDate || new Date();
      const endDate = task.endDate || null;

      await prisma.assignment.create({
        data: {
          userId: user.id,
          activityId: task.id,
          allocatedHours: parseFloat(allocatedHours.toString()),
          startDate,
          endDate,
        },
      });
      allocationCount++;
    }
  }

  // Allocate users to training
  const trainingTasks = tasks.filter((t: { type: string }) => t.type === 'INTERNAL');
  for (const task of trainingTasks) {
    const numAllocations = Math.floor(Math.random() * 10) + 5; // 5-14 users per training
    const selectedUsers = [...users]
      .sort(() => Math.random() - 0.5)
      .slice(0, numAllocations);

    for (const user of selectedUsers) {
      await prisma.assignment.create({
        data: {
          userId: user.id,
          activityId: task.id,
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

  // Generate entries for last 12 months (more comprehensive)
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);

  const projectTasks = tasks.filter((t: { type: TaskType }) => t.type === 'PROJECT');
  const daysToGenerate = 365; // Full year
  
  for (let day = 0; day < daysToGenerate; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);

    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;

    // Generate entries for some users each day (more users logging time)
    const usersToLog = [...users]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 50) + 30); // 30-80 users per day

    for (const user of usersToLog) {
      // Find user's allocations for this date
      const userAllocations = await prisma.assignment.findMany({
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
          activity: true,
        },
      });

      // Log time for some allocations
      for (const allocation of userAllocations) {
        if (Math.random() > 0.25) { // 75% chance to log time
          const hours = parseFloat(allocation.allocatedHours.toString()) / 5 + (Math.random() - 0.5) * 2; // Some variance
          const clampedHours = Math.max(0.25, Math.min(8, hours));
          
          // Sometimes log multiple entries per day (splitting work across activities)
          const numEntries = Math.random() > 0.8 ? 2 : 1; // 20% chance of 2 entries
          
          for (let e = 0; e < numEntries; e++) {
            const entryHours = e === 0 ? clampedHours : Math.min(clampedHours * 0.3, 2);
            const statuses = ['DRAFT', 'SUBMITTED', 'APPROVED'];
            const status = statuses[Math.floor(Math.random() * statuses.length)] as any;

            try {
              await prisma.timeEntry.create({
                data: {
                  userId: user.id,
                  activityId: allocation.activityId,
                  date: currentDate,
                  hours: parseFloat((Math.round(entryHours * 4) / 4).toString()), // Round to 0.25
                  description: `Work on ${allocation.activity.name}`,
                  status,
                },
              });
              entryCount++;
            } catch (error) {
              // Skip if entry already exists or other error
            }
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
    // await prisma.assignment.deleteMany();
    // await prisma.activity.deleteMany();
    // await prisma.activityScope.deleteMany();
    // await prisma.userSkill.deleteMany();
    // await prisma.user.deleteMany();

    const users = await generateUsers();
    const projects = await generateProjects(users);
    const tasks = await generateTasks(projects);
    await generateAllocations(users, tasks);
    await generateTimeEntries(users, tasks);

    // Count allocations and time entries
    const allocationCount = await prisma.assignment.count();
    const timeEntryCount = await prisma.timeEntry.count();
    const scopeCount = await prisma.activityScope.count();

    console.log('\n========================================');
    console.log('Sample data generation completed!');
    console.log('========================================');
    console.log(`\nSummary:`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Projects: ${projects.length}`);
    console.log(`- Tasks: ${tasks.length}`);
    console.log(`- Allocations (Assignments): ${allocationCount}`);
    console.log(`- Time Entries: ${timeEntryCount}`);
    console.log(`- Activity Scopes: ${scopeCount}`);
    console.log(`\nDefault login credentials (all users):`);
    console.log(`Email: ${users[0].email} (or any generated user email)`);
    console.log(`Password: password123`);
    console.log(`\nAdmin users:`);
    users.filter((u: { role: string }) => u.role === 'ADMIN').forEach((u: { email: string }) => {
      console.log(`  - ${u.email}`);
    });
    console.log('\n========================================');
  } catch (error) {
    console.error('Error generating sample data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

