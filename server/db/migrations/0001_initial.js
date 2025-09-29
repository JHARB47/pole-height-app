 
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('organizations', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    external_id: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('organizations', 'external_id', { unique: true, where: 'external_id IS NOT NULL' });

  pgm.createTable('departments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    organization_id: { type: 'uuid', notNull: true, references: 'organizations' },
    name: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('departments', ['organization_id', 'name'], { unique: true });

  pgm.createType('user_role', ['engineer', 'manager', 'admin']);

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    organization_id: { type: 'uuid', notNull: true, references: 'organizations' },
    department_id: { type: 'uuid', references: 'departments' },
    email: { type: 'text', notNull: true },
    display_name: { type: 'text' },
    role: { type: 'user_role', notNull: true, default: 'engineer' },
    sso_subject: { type: 'text' },
    status: { type: 'text', notNull: true, default: 'active' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('users', ['organization_id', 'email'], { unique: true });
  pgm.createIndex('users', 'sso_subject', { unique: true, where: 'sso_subject IS NOT NULL' });

  pgm.createTable('projects', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    organization_id: { type: 'uuid', notNull: true, references: 'organizations' },
    department_id: { type: 'uuid', references: 'departments' },
    name: { type: 'text', notNull: true },
    status: { type: 'text', notNull: true, default: 'draft' },
    metadata: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('projects', ['organization_id', 'name']);

  pgm.createTable('project_members', {
    project_id: { type: 'uuid', notNull: true, references: 'projects', onDelete: 'cascade' },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'cascade' },
    role: { type: 'user_role', notNull: true },
    added_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createConstraint('project_members', 'project_members_pk', { primaryKey: ['project_id', 'user_id'] });

  pgm.createTable('pole_sets', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    project_id: { type: 'uuid', notNull: true, references: 'projects', onDelete: 'cascade' },
    version: { type: 'int', notNull: true },
    data: { type: 'jsonb', notNull: true },
    checksum: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    created_by: { type: 'uuid', references: 'users' },
  });
  pgm.createIndex('pole_sets', ['project_id', 'version'], { unique: true });

  pgm.createType('comment_entity', ['project', 'pole', 'span']);
  pgm.createTable('comments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    project_id: { type: 'uuid', notNull: true, references: 'projects', onDelete: 'cascade' },
    author_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'cascade' },
    entity_type: { type: 'comment_entity', notNull: true, default: 'project' },
    entity_id: { type: 'text' },
    body: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('comments', ['project_id', 'created_at']);

  pgm.createTable('api_keys', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    organization_id: { type: 'uuid', notNull: true, references: 'organizations', onDelete: 'cascade' },
    name: { type: 'text', notNull: true },
    hashed_key: { type: 'text', notNull: true },
    scopes: { type: 'text[]', notNull: true, default: pgm.func('ARRAY[]::text[]') },
    last_used_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    created_by: { type: 'uuid', references: 'users' },
  });
  pgm.createIndex('api_keys', ['organization_id', 'name'], { unique: true });

  pgm.createTable('audit_events', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    organization_id: { type: 'uuid', notNull: true, references: 'organizations' },
    actor_id: { type: 'uuid', references: 'users' },
    action: { type: 'text', notNull: true },
    target_type: { type: 'text', notNull: true },
    target_id: { type: 'text' },
    context: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('audit_events', ['organization_id', 'created_at']);

  pgm.createTable('sessions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'cascade' },
    refresh_token_hash: { type: 'text', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('sessions', ['user_id', 'expires_at']);
};

exports.down = (pgm) => {
  pgm.dropTable('sessions');
  pgm.dropTable('audit_events');
  pgm.dropTable('api_keys');
  pgm.dropTable('comments');
  pgm.dropType('comment_entity');
  pgm.dropTable('pole_sets');
  pgm.dropTable('project_members');
  pgm.dropTable('projects');
  pgm.dropTable('users');
  pgm.dropType('user_role');
  pgm.dropTable('departments');
  pgm.dropTable('organizations');
  pgm.dropExtension('pgcrypto');
};
