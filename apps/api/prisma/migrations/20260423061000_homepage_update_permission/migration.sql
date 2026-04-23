INSERT INTO "role_permissions" ("role_id", "action_id", "resource_id")
SELECT role.id, action.id, resource.id
FROM "roles" role
CROSS JOIN "actions" action
CROSS JOIN "resources" resource
WHERE role.name IN ('church_admin', 'system_admin')
  AND action.name = 'update'
  AND resource.name = 'landing_page'
ON CONFLICT ("role_id", "action_id", "resource_id") DO NOTHING;
