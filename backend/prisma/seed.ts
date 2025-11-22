import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create team roles
  const roles = [
    { name: 'Risk Associate', billingRate: 150, costRate: 75 },
    { name: 'Senior Risk Associate', billingRate: 200, costRate: 100 },
    { name: 'Assistant Director', billingRate: 250, costRate: 125 },
    { name: 'Associate Director', billingRate: 300, costRate: 150 },
    { name: 'Director', billingRate: 400, costRate: 200 },
    { name: 'Senior Director', billingRate: 500, costRate: 250 },
    { name: 'Managing Director', billingRate: 600, costRate: 300 },
  ]

  const createdRoles = []
  for (const role of roles) {
    const created = await prisma.teamRole.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    })
    createdRoles.push(created)
  }

  console.log(`Created ${createdRoles.length} team roles`)

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash,
      role: 'ADMIN',
      department: 'IT',
      profile: {
        create: {},
      },
    },
  })

  console.log('Created admin user:', admin.email)

  // Create skills
  const skills = [
    { name: 'Risk Assessment', category: 'Technical' },
    { name: 'Insurance Analysis', category: 'Technical' },
    { name: 'Project Management', category: 'Management' },
    { name: 'Client Relations', category: 'Soft Skills' },
    { name: 'Data Analysis', category: 'Technical' },
  ]

  const createdSkills = []
  for (const skill of skills) {
    const created = await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    })
    createdSkills.push(created)
  }

  console.log(`Created ${createdSkills.length} skills`)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


