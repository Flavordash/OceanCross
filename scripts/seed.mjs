import postgres from "postgres";

const sql = postgres({
  host: "aws-0-us-west-2.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  username: "postgres.adnpxoytvzllnpcgajor",
  password: "OceanCross12311",
  prepare: false,
  ssl: "require",
});

async function seed() {
  // Instructors
  await sql`
    INSERT INTO profiles (id, email, full_name, role, phone) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'mike.johnson@crossocean.com', 'Mike Johnson', 'instructor', '(305) 555-0101'),
    ('a1000000-0000-0000-0000-000000000002', 'sarah.williams@crossocean.com', 'Sarah Williams', 'instructor', '(305) 555-0102'),
    ('a1000000-0000-0000-0000-000000000003', 'david.chen@crossocean.com', 'David Chen', 'instructor', '(305) 555-0103')
    ON CONFLICT (id) DO NOTHING
  `;
  console.log("3 instructors created");

  // Clients
  await sql`
    INSERT INTO profiles (id, email, full_name, role, phone) VALUES
    ('b2000000-0000-0000-0000-000000000001', 'james.smith@email.com', 'James Smith', 'client', '(786) 555-0201'),
    ('b2000000-0000-0000-0000-000000000002', 'emily.davis@email.com', 'Emily Davis', 'client', '(786) 555-0202'),
    ('b2000000-0000-0000-0000-000000000003', 'ryan.martinez@email.com', 'Ryan Martinez', 'client', '(786) 555-0203'),
    ('b2000000-0000-0000-0000-000000000004', 'olivia.brown@email.com', 'Olivia Brown', 'client', '(786) 555-0204'),
    ('b2000000-0000-0000-0000-000000000005', 'daniel.wilson@email.com', 'Daniel Wilson', 'client', '(786) 555-0205')
    ON CONFLICT (id) DO NOTHING
  `;
  console.log("5 clients created");

  // Mechanics
  await sql`
    INSERT INTO profiles (id, email, full_name, role, phone) VALUES
    ('c3000000-0000-0000-0000-000000000001', 'carlos.garcia@crossocean.com', 'Carlos Garcia', 'mechanic', '(305) 555-0301'),
    ('c3000000-0000-0000-0000-000000000002', 'tony.nguyen@crossocean.com', 'Tony Nguyen', 'mechanic', '(305) 555-0302')
    ON CONFLICT (id) DO NOTHING
  `;
  console.log("2 mechanics created");

  // Aircraft
  await sql`
    INSERT INTO aircraft (id, registration, type, model, status, total_hours) VALUES
    ('d4000000-0000-0000-0000-000000000002', 'N67890', 'Single Engine', 'Piper Cherokee', 'available', 3200),
    ('d4000000-0000-0000-0000-000000000003', 'N24680', 'Multi Engine', 'Piper Seminole', 'available', 1800),
    ('d4000000-0000-0000-0000-000000000004', 'N13579', 'Single Engine', 'Cessna 152', 'in_maintenance', 5100),
    ('d4000000-0000-0000-0000-000000000005', 'N99887', 'Single Engine', 'Diamond DA40', 'available', 950)
    ON CONFLICT (registration) DO NOTHING
  `;
  console.log("4 aircraft added");

  // Sample schedule events for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const ds = tomorrow.toISOString().split("T")[0];

  await sql`
    INSERT INTO schedule_events (title, type, start_time, end_time, aircraft_id, instructor_id, student_id, status) VALUES
    ('Flight Training - James Smith', 'flight_training',
     ${ds + "T14:00:00.000Z"}, ${ds + "T16:00:00.000Z"},
     (SELECT id FROM aircraft WHERE registration = 'N12345'),
     'a1000000-0000-0000-0000-000000000001',
     'b2000000-0000-0000-0000-000000000001',
     'scheduled'),
    ('Ground School - Intro to Navigation', 'ground_school',
     ${ds + "T18:00:00.000Z"}, ${ds + "T20:00:00.000Z"},
     NULL,
     'a1000000-0000-0000-0000-000000000002',
     NULL,
     'scheduled')
  `;
  console.log("2 sample events created for " + ds);

  // Maintenance job
  await sql`
    INSERT INTO maintenance_jobs (aircraft_id, description, status, mechanic_id, bay, estimated_start, estimated_end) VALUES
    ('d4000000-0000-0000-0000-000000000004', '100-hour inspection', 'in_progress',
     'c3000000-0000-0000-0000-000000000001', 'Bay A',
     ${ds + "T08:00:00.000Z"}, ${ds + "T17:00:00.000Z"})
  `;
  console.log("1 maintenance job created");

  // Client tags
  await sql`
    INSERT INTO client_tags (name, color) VALUES
    ('Student', '#3B82F6'),
    ('Repair Request', '#F97316'),
    ('Client', '#22C55E')
    ON CONFLICT (name) DO NOTHING
  `;
  console.log("3 default client tags created");

  // Assign tags to seeded clients
  await sql`
    INSERT INTO profile_tags (profile_id, tag_id)
    SELECT p.id, t.id
    FROM profiles p, client_tags t
    WHERE p.role = 'client' AND t.name = 'Client'
    ON CONFLICT DO NOTHING
  `;
  console.log("Tags assigned to clients");

  // Verify
  const counts = await sql`
    SELECT
      (SELECT count(*) FROM profiles WHERE role = 'instructor') as instructors,
      (SELECT count(*) FROM profiles WHERE role = 'client') as clients,
      (SELECT count(*) FROM profiles WHERE role = 'mechanic') as mechanics,
      (SELECT count(*) FROM aircraft) as aircraft,
      (SELECT count(*) FROM schedule_events) as events,
      (SELECT count(*) FROM maintenance_jobs) as jobs
  `;
  console.log("\nDatabase summary:");
  console.log(JSON.stringify(counts[0], null, 2));

  await sql.end();
}

seed().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
