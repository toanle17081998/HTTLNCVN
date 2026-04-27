import { PrismaClient } from '@prisma/client';
async function main() {
  const p = new PrismaClient();
  const grades = await p.courseGrade.findMany({ include: { course: { select: { slug: true } }, user: { select: { email: true } } } });
  const atts = await p.courseAttendance.findMany({ include: { course: { select: { slug: true } }, user: { select: { email: true } } } });
  console.log('Grades:', grades.length);
  grades.forEach(g => console.log(`- User: ${g.user.email}, Course: ${g.course.slug}, Status: ${g.status}`));
  console.log('Attendances:', atts.length);
  atts.forEach(a => console.log(`- User: ${a.user.email}, Course: ${a.course.slug}`));
  
  // Check a specific user who was just enrolled
  // (Assuming user might have provided one or I can see from logs)
  
  await p.$disconnect();
}
main();
