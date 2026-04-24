import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const actions = [
  'read',
  'create',
  'update',
  'delete',
  'share',
  'enroll',
  'take',
  'manage',
] as const;

const resources = [
  'landing_page',
  'about_page',
  'contact_page',
  'article',
  'prayer_journal',
  'course',
  'lesson',
  'quiz',
  'certificate',
  'event',
  'search',
  'notification',
  'member',
  'church_unit',
  'member_permission',
  'role_schema',
  'system_setting',
  'integration',
  'database_config',
  'user_analytics',
  'backup',
  'audit_log',
  'all_data',
] as const;

const rolePermissions = {
  guest: [
    ['read', 'landing_page'],
    ['read', 'about_page'],
    ['read', 'contact_page'],
    ['read', 'article'],
  ],
  church_member: [
    ['read', 'landing_page'],
    ['read', 'about_page'],
    ['read', 'contact_page'],
    ['read', 'article'],
    ['read', 'event'],
    ['read', 'prayer_journal'],
    ['create', 'prayer_journal'],
    ['update', 'prayer_journal'],
    ['delete', 'prayer_journal'],
    ['share', 'prayer_journal'],
    ['read', 'course'],
    ['enroll', 'course'],
    ['read', 'lesson'],
    ['take', 'quiz'],
    ['read', 'certificate'],
    ['read', 'search'],
    ['read', 'notification'],
    ['read', 'church_unit'],
  ],
  church_admin: [
    ['read', 'landing_page'],
    ['update', 'landing_page'],
    ['read', 'about_page'],
    ['update', 'about_page'],
    ['read', 'contact_page'],
    ['update', 'contact_page'],
    ['read', 'article'],
    ['create', 'article'],
    ['update', 'article'],
    ['delete', 'article'],
    ['read', 'event'],
    ['create', 'event'],
    ['update', 'event'],
    ['delete', 'event'],
    ['read', 'prayer_journal'],
    ['create', 'prayer_journal'],
    ['update', 'prayer_journal'],
    ['delete', 'prayer_journal'],
    ['share', 'prayer_journal'],
    ['manage', 'prayer_journal'],
    ['read', 'course'],
    ['create', 'course'],
    ['update', 'course'],
    ['delete', 'course'],
    ['enroll', 'course'],
    ['read', 'lesson'],
    ['create', 'lesson'],
    ['update', 'lesson'],
    ['delete', 'lesson'],
    ['take', 'quiz'],
    ['create', 'quiz'],
    ['update', 'quiz'],
    ['delete', 'quiz'],
    ['read', 'certificate'],
    ['read', 'search'],
    ['read', 'notification'],
    ['create', 'notification'],
    ['read', 'member'],
    ['create', 'member'],
    ['update', 'member'],
    ['delete', 'member'],
    ['read', 'church_unit'],
    ['create', 'church_unit'],
    ['update', 'church_unit'],
    ['delete', 'church_unit'],
    ['manage', 'member_permission'],
  ],
  system_admin: [
    ['read', 'landing_page'],
    ['update', 'landing_page'],
    ['read', 'about_page'],
    ['update', 'about_page'],
    ['read', 'contact_page'],
    ['update', 'contact_page'],
    ['read', 'article'],
    ['create', 'article'],
    ['update', 'article'],
    ['delete', 'article'],
    ['read', 'event'],
    ['create', 'event'],
    ['update', 'event'],
    ['delete', 'event'],
    ['read', 'prayer_journal'],
    ['create', 'prayer_journal'],
    ['update', 'prayer_journal'],
    ['delete', 'prayer_journal'],
    ['share', 'prayer_journal'],
    ['manage', 'prayer_journal'],
    ['read', 'course'],
    ['create', 'course'],
    ['update', 'course'],
    ['delete', 'course'],
    ['enroll', 'course'],
    ['read', 'lesson'],
    ['create', 'lesson'],
    ['update', 'lesson'],
    ['delete', 'lesson'],
    ['take', 'quiz'],
    ['create', 'quiz'],
    ['update', 'quiz'],
    ['delete', 'quiz'],
    ['read', 'certificate'],
    ['read', 'search'],
    ['read', 'notification'],
    ['create', 'notification'],
    ['read', 'member'],
    ['create', 'member'],
    ['update', 'member'],
    ['delete', 'member'],
    ['read', 'church_unit'],
    ['create', 'church_unit'],
    ['update', 'church_unit'],
    ['delete', 'church_unit'],
    ['manage', 'member_permission'],
    ['manage', 'role_schema'],
    ['manage', 'system_setting'],
    ['manage', 'integration'],
    ['manage', 'database_config'],
    ['read', 'user_analytics'],
    ['manage', 'backup'],
    ['read', 'audit_log'],
    ['manage', 'all_data'],
  ],
} satisfies Record<string, Array<[string, string]>>;

async function main(): Promise<void> {
  const actionByName = new Map<string, { id: number }>();
  for (const name of actions) {
    const action = await prisma.action.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    actionByName.set(name, action);
  }

  const resourceByName = new Map<string, { id: number }>();
  for (const name of resources) {
    const resource = await prisma.resource.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    resourceByName.set(name, resource);
  }

  const roleByName = new Map<string, { id: number; name: string }>();
  for (const name of Object.keys(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    roleByName.set(name, role);
  }

  for (const [roleName, permissions] of Object.entries(rolePermissions)) {
    const role = roleByName.get(roleName);
    if (!role) continue;

    await prisma.rolePermission.deleteMany({
      where: { role_id: role.id },
    });

    for (const [actionName, resourceName] of permissions) {
      const action = actionByName.get(actionName);
      const resource = resourceByName.get(resourceName);
      if (!action || !resource) continue;

      await prisma.rolePermission.upsert({
        where: {
          role_id_action_id_resource_id: {
            action_id: action.id,
            resource_id: resource.id,
            role_id: role.id,
          },
        },
        create: {
          action_id: action.id,
          resource_id: resource.id,
          role_id: role.id,
        },
        update: {},
      });
    }
  }

  // Article categories
  const newsCategory = await prisma.articleCategory.upsert({
    where: { name: 'Tin tức' },
    create: { name: 'Tin tức', description: 'Tin tức và thông báo của Hội thánh' },
    update: {},
  });
  const sermonCategory = await prisma.articleCategory.upsert({
    where: { name: 'Bài giảng' },
    create: { name: 'Bài giảng', description: 'Bài giảng Lời Chúa hàng tuần' },
    update: {},
  });
  await prisma.articleCategory.upsert({
    where: { name: 'Tĩnh nguyện' },
    create: { name: 'Tĩnh nguyện', description: 'Bài tĩnh nguyện và suy gẫm Lời Chúa' },
    update: {},
  });

  // Event categories
  const worshipCategory = await prisma.eventCategory.upsert({
    where: { name: 'Thờ phượng' },
    create: { name: 'Thờ phượng', description: 'Các buổi thờ phượng và nhóm họp' },
    update: {},
  });
  const trainingCategory = await prisma.eventCategory.upsert({
    where: { name: 'Đào tạo' },
    create: { name: 'Đào tạo', description: 'Các khóa học và chương trình đào tạo' },
    update: {},
  });
  await prisma.eventCategory.upsert({
    where: { name: 'Cộng đồng' },
    create: { name: 'Cộng đồng', description: 'Hoạt động cộng đồng và thanh niên' },
    update: {},
  });

  // Prayer categories
  for (const cat of [
    { name: 'Chữa lành', description: 'Cầu nguyện cho sự chữa lành thể xác và tâm hồn' },
    { name: 'Gia đình', description: 'Cầu nguyện cho gia đình và con cái' },
    { name: 'Dẫn dắt', description: 'Cầu nguyện xin sự dẫn dắt của Đức Chúa Trời' },
    { name: 'Cảm tạ', description: 'Dâng lời cảm tạ và ngợi khen' },
    { name: 'Cầu thay', description: 'Cầu thay cho anh chị em và người thân' },
    { name: 'Hội thánh', description: 'Cầu nguyện cho Hội thánh và công việc Chúa' },
  ]) {
    await prisma.prayerCategory.upsert({
      where: { name: cat.name },
      create: cat,
      update: {},
    });
  }

  const password = await bcrypt.hash('seed-password', 10);
  const memberRole = roleByName.get('church_member')!;
  const churchAdminRole = roleByName.get('church_admin')!;
  const systemAdminRole = roleByName.get('system_admin')!;

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@htnc.local' },
    create: {
      username: 'admin',
      email: 'admin@htnc.local',
      password_hash: password,
      role_id: systemAdminRole.id,
      profile: {
        create: { first_name: 'System', last_name: 'Admin' },
      },
    },
    update: { role_id: systemAdminRole.id },
  });

  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@htnc.local' },
    create: {
      username: 'editor',
      email: 'editor@htnc.local',
      password_hash: password,
      role_id: churchAdminRole.id,
      profile: {
        create: { first_name: 'Church', last_name: 'Editor' },
      },
    },
    update: { role_id: churchAdminRole.id },
  });

  const instructorUser = await prisma.user.upsert({
    where: { email: 'instructor@htnc.local' },
    create: {
      username: 'instructor',
      email: 'instructor@htnc.local',
      password_hash: password,
      role_id: churchAdminRole.id,
      profile: {
        create: { first_name: 'Course', last_name: 'Instructor' },
      },
    },
    update: { role_id: churchAdminRole.id },
  });

  await prisma.user.upsert({
    where: { email: 'member@htnc.local' },
    create: {
      username: 'member',
      email: 'member@htnc.local',
      password_hash: password,
      role_id: memberRole.id,
      profile: {
        create: { first_name: 'Church', last_name: 'Member' },
      },
    },
    update: { role_id: memberRole.id },
  });

  for (let i = 1; i <= 20; i++) {
    const email = `member${i}@htnc.local`;
    const username = `member${i}`;

    await prisma.user.upsert({
      where: { email },
      create: {
        username,
        email,
        password_hash: password,
        role_id: memberRole.id,
        profile: {
          create: { first_name: 'Member', last_name: `${i}` },
        },
      },
      update: { role_id: memberRole.id },
    });
  }

  // Articles
  await prisma.article.upsert({
    where: { slug: 'chao-mung-den-voi-hoi-thanh-nhan-cap' },
    create: {
      slug: 'chao-mung-den-voi-hoi-thanh-nhan-cap',
      title_en: 'Welcome to Nhan Cap Church',
      title_vi: 'Chào mừng đến với Hội thánh Nhân Cấp',
      content_markdown_en: `# Welcome to Nhan Cap Church

We are a Protestant congregation located in Hanoi, Vietnam.

**Service Hours:** Sunday mornings, 8:30 AM – 11:30 AM

**Address:** 3rd Floor, 20 Lane 165 Cau Giay Street, Quan Hoa, Hanoi

We warmly welcome everyone who desires to know God and grow in faith.`,
      content_markdown_vi: `# Chào mừng đến với Hội thánh Nhân Cấp

Chúng tôi là một Hội thánh Tin Lành tọa lạc tại Hà Nội, Việt Nam.

**Giờ nhóm:** Chủ nhật, 8h30 – 11h30 sáng

**Địa chỉ:** Tầng 3, số 20 ngõ 165 Cầu Giấy, Quan Hoa, Hà Nội

Chúng tôi chào đón tất cả mọi người muốn tìm hiểu về Đức Chúa Trời và tăng trưởng trong đức tin.`,
      status: 'published',
      published_at: new Date('2024-01-01'),
      cover_image_url: 'https://placehold.co/800x400',
      category_id: newsCategory.id,
      created_by: editorUser.id,
    },
    update: {},
  });

  await prisma.article.upsert({
    where: { slug: 'bai-giang-chu-nhat-yeu-thuong-chua-het-long' },
    create: {
      slug: 'bai-giang-chu-nhat-yeu-thuong-chua-het-long',
      title_en: "Sunday Sermon: Love the Lord Your God with All Your Heart",
      title_vi: 'Bài giảng Chúa nhật: Yêu thương Chúa hết lòng',
      content_markdown_en: `# Love the Lord Your God with All Your Heart

*Mark 12:30 — "Love the Lord your God with all your heart and with all your soul and with all your mind and with all your strength."*

This is the greatest commandment. True love for God is not merely an emotion — it is a commitment of the entire person: heart, soul, mind, and strength.`,
      content_markdown_vi: `# Yêu thương Chúa hết lòng

*Mác 12:30 — "Ngươi phải hết lòng, hết linh hồn, hết trí khôn, hết sức mà kính mến Chúa là Đức Chúa Trời ngươi."*

Đây là điều răn lớn nhất. Tình yêu thương Đức Chúa Trời không chỉ là cảm xúc — đó là sự dâng hiến trọn vẹn con người: lòng, linh hồn, trí khôn và sức lực.`,
      status: 'published',
      published_at: new Date('2024-03-10'),
      cover_image_url: 'https://placehold.co/800x400',
      category_id: sermonCategory.id,
      created_by: editorUser.id,
    },
    update: {},
  });

  await prisma.article.upsert({
    where: { slug: 'tien-hon-nhan-chon-nguoi-ban-doi' },
    create: {
      slug: 'tien-hon-nhan-chon-nguoi-ban-doi',
      title_en: 'Pre-Marriage: How to Choose a Life Partner?',
      title_vi: 'Tiền hôn nhân – Cách chọn người bạn đời?',
      content_markdown_en: `# Pre-Marriage: How to Choose a Life Partner?

Choosing a life partner is one of the most important decisions in life. As Christians, we are called to seek God's guidance in this journey.

Key principles:
- Pray and seek God's will
- Look for someone who shares your faith
- Seek counsel from mature believers`,
      content_markdown_vi: `# Tiền hôn nhân – Cách chọn người bạn đời?

Chọn người bạn đời là một trong những quyết định quan trọng nhất trong cuộc đời. Là Cơ Đốc nhân, chúng ta được kêu gọi tìm kiếm sự hướng dẫn của Đức Chúa Trời trong hành trình này.

Các nguyên tắc cơ bản:
- Cầu nguyện và tìm kiếm ý Chúa
- Tìm kiếm người cùng đức tin
- Tham khảo ý kiến của những tín hữu trưởng thành`,
      status: 'published',
      published_at: new Date('2024-04-01'),
      cover_image_url: 'https://placehold.co/800x400',
      category_id: newsCategory.id,
      created_by: editorUser.id,
    },
    update: {},
  });

  // Courses — ISOM program
  const course1 = await prisma.course.upsert({
    where: { slug: 'isom-1-aa' },
    create: {
      slug: 'isom-1-aa',
      title_en: 'ISOM 1 – Associate of Arts in Ministry',
      title_vi: 'ISOM 1 – Chương trình thần học cơ bản (AA)',
      summary: 'Chương trình đào tạo thần học bậc đại học cơ sở dành cho người muốn phục vụ Chúa.',
      description: `Chương trình ISOM 1 (International School of Ministry – Associate of Arts) trang bị nền tảng thần học vững chắc và kỹ năng phục vụ thực tiễn cho người học. Phù hợp với tín hữu muốn hiểu sâu hơn về Lời Chúa và bắt đầu hành trình phục vụ trong Hội thánh.`,
      level: 'beginner',
      status: 'published',
      estimated_duration_minutes: 1800,
      cover_image_url: 'https://placehold.co/800x400',
      published_at: new Date('2024-01-15'),
      created_by: instructorUser.id,
    },
    update: {},
  });

  await prisma.lesson.upsert({
    where: { id: 'aaaaaaaa-0001-0001-0001-000000000001' },
    create: {
      id: 'aaaaaaaa-0001-0001-0001-000000000001',
      course_id: course1.id,
      title_en: 'The Bible: Word of God',
      title_vi: 'Kinh Thánh – Lời Đức Chúa Trời',
      content_markdown_en: `# The Bible: Word of God

The Bible is the inspired, infallible, and authoritative Word of God. It consists of 66 books written by approximately 40 authors over 1,500 years, yet maintains one unified message: God's redemptive plan for humanity through Jesus Christ.

## Key Truths
- **Inspiration:** All Scripture is God-breathed (2 Timothy 3:16)
- **Authority:** The Bible is the final authority for faith and practice
- **Unity:** Old and New Testaments point to Jesus Christ`,
      content_markdown_vi: `# Kinh Thánh – Lời Đức Chúa Trời

Kinh Thánh là Lời Đức Chúa Trời được hà hơi, không sai lầm và có thẩm quyền tối cao. Kinh Thánh gồm 66 sách được viết bởi khoảng 40 tác giả trong hơn 1.500 năm, nhưng vẫn duy trì một thông điệp thống nhất: kế hoạch cứu chuộc của Đức Chúa Trời cho nhân loại qua Đức Chúa Jêsus Christ.

## Các chân lý căn bản
- **Sự hà hơi:** Cả Kinh Thánh đều được Đức Chúa Trời hà hơi (2 Ti-mô-thê 3:16)
- **Thẩm quyền:** Kinh Thánh là thẩm quyền tối cao cho đức tin và nếp sống
- **Sự thống nhất:** Cựu Ước và Tân Ước đều chỉ về Đức Chúa Jêsus Christ`,
      order_index: 1,
      created_by: instructorUser.id,
    },
    update: {},
  });

  await prisma.lesson.upsert({
    where: { id: 'aaaaaaaa-0001-0001-0001-000000000002' },
    create: {
      id: 'aaaaaaaa-0001-0001-0001-000000000002',
      course_id: course1.id,
      title_en: 'The Nature of God',
      title_vi: 'Bản tính của Đức Chúa Trời',
      content_markdown_en: `# The Nature of God

God is eternal, omniscient, omnipotent, and omnipresent. He exists as one God in three Persons: Father, Son, and Holy Spirit — the Trinity.

## Attributes of God
- **Holiness:** God is absolutely holy and set apart
- **Love:** God is love (1 John 4:8)
- **Justice:** God is perfectly just and righteous
- **Mercy:** God delights in showing mercy to the repentant`,
      content_markdown_vi: `# Bản tính của Đức Chúa Trời

Đức Chúa Trời là đời đời, toàn tri, toàn năng và hiện diện khắp nơi. Ngài tồn tại là một Đức Chúa Trời trong ba Thân Vị: Cha, Con và Thánh Linh — Ba Ngôi.

## Thuộc tính của Đức Chúa Trời
- **Sự thánh khiết:** Đức Chúa Trời tuyệt đối thánh khiết và biệt riêng
- **Tình yêu thương:** Đức Chúa Trời là tình yêu thương (1 Giăng 4:8)
- **Sự công bình:** Đức Chúa Trời hoàn toàn công bình và ngay thẳng
- **Lòng thương xót:** Đức Chúa Trời vui lòng bày tỏ lòng thương xót`,
      order_index: 2,
      created_by: instructorUser.id,
    },
    update: {},
  });

  await prisma.lesson.upsert({
    where: { id: 'aaaaaaaa-0001-0001-0001-000000000003' },
    create: {
      id: 'aaaaaaaa-0001-0001-0001-000000000003',
      course_id: course1.id,
      title_en: 'Salvation: God\'s Gift',
      title_vi: 'Sự cứu rỗi – Món quà của Đức Chúa Trời',
      content_markdown_en: `# Salvation: God's Gift

Salvation is the gracious act of God by which He delivers humanity from sin and its consequences. It is received by grace through faith in Jesus Christ alone.

## The Plan of Salvation
1. All have sinned (Romans 3:23)
2. The penalty of sin is death (Romans 6:23)
3. Christ died for our sins (Romans 5:8)
4. Salvation comes through faith (Ephesians 2:8-9)`,
      content_markdown_vi: `# Sự cứu rỗi – Món quà của Đức Chúa Trời

Sự cứu rỗi là hành động ân sủng của Đức Chúa Trời, qua đó Ngài giải cứu nhân loại khỏi tội lỗi và hậu quả của nó. Sự cứu rỗi được nhận lãnh bởi ân sủng qua đức tin nơi chính mình Đức Chúa Jêsus Christ.

## Kế hoạch cứu rỗi
1. Mọi người đều đã phạm tội (Rô-ma 3:23)
2. Hình phạt của tội lỗi là sự chết (Rô-ma 6:23)
3. Đấng Christ đã chết vì tội lỗi chúng ta (Rô-ma 5:8)
4. Sự cứu rỗi đến qua đức tin (Ê-phê-sô 2:8-9)`,
      order_index: 3,
      created_by: instructorUser.id,
    },
    update: {},
  });

  const course2 = await prisma.course.upsert({
    where: { slug: 'isom-2-ba' },
    create: {
      slug: 'isom-2-ba',
      title_en: 'ISOM 2 – Bachelor of Arts in Ministry',
      title_vi: 'ISOM 2 – Chương trình thần học nâng cao (BA)',
      summary: 'Chương trình đào tạo thần học bậc cử nhân dành cho người muốn phục vụ Chúa chuyên sâu.',
      description: `Chương trình ISOM 2 (International School of Ministry – Bachelor of Arts) đi sâu vào thần học hệ thống, lãnh đạo Hội thánh và thực hành mục vụ. Dành cho những ai đã hoàn thành ISOM 1 hoặc có nền tảng thần học căn bản.`,
      level: 'intermediate',
      status: 'published',
      estimated_duration_minutes: 2400,
      cover_image_url: 'https://placehold.co/800x400',
      published_at: new Date('2024-02-01'),
      created_by: instructorUser.id,
    },
    update: {},
  });

  await prisma.lesson.upsert({
    where: { id: 'aaaaaaaa-0002-0001-0001-000000000001' },
    create: {
      id: 'aaaaaaaa-0002-0001-0001-000000000001',
      course_id: course2.id,
      title_en: 'The Holy Spirit and Spiritual Gifts',
      title_vi: 'Đức Thánh Linh và ân tứ thuộc linh',
      content_markdown_en: `# The Holy Spirit and Spiritual Gifts

The Holy Spirit is the third Person of the Trinity, sent by the Father and the Son to dwell in believers, empower them for service, and guide them into all truth.

## Gifts of the Spirit (1 Corinthians 12)
- Gifts of revelation: wisdom, knowledge, discernment
- Gifts of power: faith, healing, miracles
- Gifts of speech: prophecy, tongues, interpretation`,
      content_markdown_vi: `# Đức Thánh Linh và ân tứ thuộc linh

Đức Thánh Linh là Thân Vị thứ ba của Ba Ngôi, được Cha và Con sai đến ngự trong các tín hữu, trao quyền năng cho họ phục vụ và dẫn dắt họ vào mọi lẽ thật.

## Ân tứ của Đức Thánh Linh (1 Cô-rinh-tô 12)
- Ân tứ mặc khải: khôn ngoan, hiểu biết, phân biệt thần linh
- Ân tứ quyền năng: đức tin, chữa bệnh, làm phép lạ
- Ân tứ lời nói: nói tiên tri, nói tiếng lạ, thông giải tiếng lạ`,
      order_index: 1,
      created_by: instructorUser.id,
    },
    update: {},
  });

  await prisma.lesson.upsert({
    where: { id: 'aaaaaaaa-0002-0001-0001-000000000002' },
    create: {
      id: 'aaaaaaaa-0002-0001-0001-000000000002',
      course_id: course2.id,
      title_en: 'Church Leadership and Ministry',
      title_vi: 'Lãnh đạo và quản trị Hội thánh',
      content_markdown_en: `# Church Leadership and Ministry

Effective church leadership is servant leadership, modeled after Jesus Christ who came "not to be served, but to serve" (Mark 10:45).

## Leadership Roles (Ephesians 4:11)
- **Apostles** — sent ones who establish new works
- **Prophets** — speak God's word to build and guide
- **Evangelists** — proclaim the gospel and win the lost
- **Pastors/Teachers** — shepherd and disciple the flock`,
      content_markdown_vi: `# Lãnh đạo và quản trị Hội thánh

Lãnh đạo Hội thánh hiệu quả là lãnh đạo phục vụ, theo gương Đức Chúa Jêsus đến "không phải để được phục vụ, mà để phục vụ" (Mác 10:45).

## Các chức vụ lãnh đạo (Ê-phê-sô 4:11)
- **Sứ đồ** — người được sai đi thiết lập công việc mới
- **Tiên tri** — truyền đạt Lời Chúa để xây dựng và hướng dẫn
- **Người truyền giáo** — rao truyền Phúc Âm và dẫn người đến với Chúa
- **Mục sư/Giáo sư** — chăn dắt và môn đồ hóa đoàn chiên`,
      order_index: 2,
      created_by: instructorUser.id,
    },
    update: {},
  });

  const bibleTemplate1 = await prisma.questionTemplate.upsert({
    where: { id: 'bbbbbbbb-0001-0001-0001-000000000001' },
    create: {
      id: 'bbbbbbbb-0001-0001-0001-000000000001',
      lesson_id: 'aaaaaaaa-0001-0001-0001-000000000001',
      template_type: 'short_answer',
      difficulty: 'easy',
      body_template_en: 'How many books are in the Bible?',
      body_template_vi: 'Kinh Thánh có bao nhiêu sách?',
      explanation_template_en: 'The Protestant Bible contains 66 books.',
      explanation_template_vi: 'Kinh Thánh Tin Lành gồm 66 sách.',
      answer_formula: '66',
      logic_config: {},
    },
    update: {},
  });

  const bibleTemplate2 = await prisma.questionTemplate.upsert({
    where: { id: 'bbbbbbbb-0001-0001-0001-000000000002' },
    create: {
      id: 'bbbbbbbb-0001-0001-0001-000000000002',
      lesson_id: 'aaaaaaaa-0001-0001-0001-000000000001',
      template_type: 'short_answer',
      difficulty: 'easy',
      body_template_en: 'According to 2 Timothy 3:16, Scripture is breathed out by whom?',
      body_template_vi: 'Theo 2 Ti-mô-thê 3:16, Kinh Thánh được hà hơi bởi ai?',
      explanation_template_en: 'Scripture is God-breathed.',
      explanation_template_vi: 'Cả Kinh Thánh đều được Đức Chúa Trời hà hơi.',
      answer_formula: 'God',
      logic_config: {},
    },
    update: {},
  });

  const salvationTemplate1 = await prisma.questionTemplate.upsert({
    where: { id: 'bbbbbbbb-0001-0001-0001-000000000003' },
    create: {
      id: 'bbbbbbbb-0001-0001-0001-000000000003',
      lesson_id: 'aaaaaaaa-0001-0001-0001-000000000003',
      template_type: 'short_answer',
      difficulty: 'medium',
      body_template_en: 'According to Ephesians 2:8-9, salvation is received through what?',
      body_template_vi: 'Theo Ê-phê-sô 2:8-9, sự cứu rỗi được nhận lãnh qua điều gì?',
      explanation_template_en: 'Salvation is by grace through faith.',
      explanation_template_vi: 'Sự cứu rỗi bởi ân điển qua đức tin.',
      answer_formula: 'faith',
      logic_config: {},
    },
    update: {},
  });

  const spiritTemplate1 = await prisma.questionTemplate.upsert({
    where: { id: 'bbbbbbbb-0002-0001-0001-000000000001' },
    create: {
      id: 'bbbbbbbb-0002-0001-0001-000000000001',
      lesson_id: 'aaaaaaaa-0002-0001-0001-000000000001',
      template_type: 'short_answer',
      difficulty: 'medium',
      body_template_en: 'Who is the third Person of the Trinity?',
      body_template_vi: 'Thân vị thứ ba của Ba Ngôi là ai?',
      explanation_template_en: 'The Holy Spirit is the third Person of the Trinity.',
      explanation_template_vi: 'Đức Thánh Linh là Thân Vị thứ ba của Ba Ngôi.',
      answer_formula: 'Holy Spirit',
      logic_config: {},
    },
    update: {},
  });

  const quiz1 = await prisma.quiz.upsert({
    where: { id: 'cccccccc-0001-0001-0001-000000000001' },
    create: {
      id: 'cccccccc-0001-0001-0001-000000000001',
      title_en: 'ISOM 1 Foundations Quiz',
      title_vi: 'Bài kiểm tra nền tảng ISOM 1',
      passing_score: 70,
      time_limit_seconds: 900,
      is_active: true,
    },
    update: {
      title_en: 'ISOM 1 Foundations Quiz',
      title_vi: 'Bài kiểm tra nền tảng ISOM 1',
      passing_score: 70,
      time_limit_seconds: 900,
      is_active: true,
    },
  });
  await prisma.quizTemplateMap.deleteMany({ where: { quiz_id: quiz1.id } });
  await prisma.quizTemplateMap.createMany({
    data: [bibleTemplate1, bibleTemplate2, salvationTemplate1].map((template, index) => ({
      quiz_id: quiz1.id,
      template_id: template.id,
      position: index + 1,
      weight: 1,
    })),
  });

  const quiz2 = await prisma.quiz.upsert({
    where: { id: 'cccccccc-0002-0001-0001-000000000001' },
    create: {
      id: 'cccccccc-0002-0001-0001-000000000001',
      title_en: 'Holy Spirit Quiz',
      title_vi: 'Bài kiểm tra Đức Thánh Linh',
      passing_score: 70,
      time_limit_seconds: 600,
      is_active: true,
    },
    update: {
      title_en: 'Holy Spirit Quiz',
      title_vi: 'Bài kiểm tra Đức Thánh Linh',
      passing_score: 70,
      time_limit_seconds: 600,
      is_active: true,
    },
  });
  await prisma.quizTemplateMap.deleteMany({ where: { quiz_id: quiz2.id } });
  await prisma.quizTemplateMap.createMany({
    data: [spiritTemplate1].map((template, index) => ({
      quiz_id: quiz2.id,
      template_id: template.id,
      position: index + 1,
      weight: 1,
    })),
  });

  // Events
  const nextSunday = new Date();
  nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7 || 7));
  nextSunday.setHours(8, 30, 0, 0);
  const nextSundayEnd = new Date(nextSunday);
  nextSundayEnd.setHours(11, 30, 0, 0);

  await prisma.event.upsert({
    where: { slug: 'tho-phuong-chu-nhat' },
    create: {
      slug: 'tho-phuong-chu-nhat',
      title: 'Thờ phượng Chúa nhật',
      description: 'Buổi thờ phượng hàng tuần của Hội thánh Nhân Cấp. Chương trình gồm ca ngợi thờ phượng, Lời Chúa và thông công.',
      starts_at: nextSunday,
      ends_at: nextSundayEnd,
      location: 'Tầng 3, số 20 ngõ 165 Cầu Giấy, Quan Hoa, Hà Nội',
      status: 'published',
      audience: 'public',
      cover_image_url: 'https://placehold.co/800x400',
      category_id: worshipCategory.id,
      created_by: adminUser.id,
    },
    update: {},
  });

  const isomStartDate = new Date();
  isomStartDate.setDate(isomStartDate.getDate() + 14);
  isomStartDate.setHours(14, 0, 0, 0);
  const isomEndDate = new Date(isomStartDate);
  isomEndDate.setHours(17, 0, 0, 0);

  await prisma.event.upsert({
    where: { slug: 'khai-giang-isom-1-aa' },
    create: {
      slug: 'khai-giang-isom-1-aa',
      title: 'Khai giảng ISOM 1 – AA',
      description: 'Lễ khai giảng chương trình đào tạo thần học ISOM 1 (Associate of Arts). Đăng ký tham gia để được trang bị nền tảng thần học vững chắc và kỹ năng phục vụ.',
      starts_at: isomStartDate,
      ends_at: isomEndDate,
      location: 'Tầng 3, số 20 ngõ 165 Cầu Giấy, Quan Hoa, Hà Nội',
      status: 'published',
      audience: 'public',
      cover_image_url: 'https://placehold.co/800x400',
      category_id: trainingCategory.id,
      created_by: adminUser.id,
    },
    update: {},
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
