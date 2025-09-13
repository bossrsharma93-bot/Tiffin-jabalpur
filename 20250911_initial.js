exports.up = async function(knex) {
  await knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('phone', 20).notNullable().unique();
    table.string('name').nullable();
    table.string('email').nullable();
    table.boolean('is_verified').defaultTo(false);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('vendors', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('address').nullable();
    table.string('phone',20).nullable();
    table.decimal('lat', 10, 6).nullable();
    table.decimal('lng', 10, 6).nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('orders', table => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.integer('vendor_id').references('id').inTable('vendors').onDelete('SET NULL');
    table.jsonb('items').notNullable();
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('delivery_fee', 10, 2).notNullable();
    table.decimal('total', 10, 2).notNullable();
    table.string('status').notNullable().defaultTo('pending');
    table.string('payment_provider').nullable();
    table.string('payment_id').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('payments', table => {
    table.increments('id').primary();
    table.integer('order_id').references('id').inTable('orders').onDelete('CASCADE');
    table.decimal('amount', 10,2).notNullable();
    table.string('provider').notNullable();
    table.string('provider_payment_id').nullable();
    table.string('status').notNullable();
    table.jsonb('meta').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('fcm_tokens', table => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('token', 512).notNullable();
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('fcm_tokens');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('orders');
  await knex.schema.dropTableIfExists('vendors');
  await knex.schema.dropTableIfExists('users');
};
