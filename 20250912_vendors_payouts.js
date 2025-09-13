exports.up = async function(knex) {
  // vendor admins and payout tables
  await knex.schema.createTableIfNotExists('vendor_admins', table => {
    table.increments('id').primary();
    table.integer('vendor_id').references('id').inTable('vendors').onDelete('CASCADE');
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTableIfNotExists('payouts', table => {
    table.increments('id').primary();
    table.integer('vendor_id').references('id').inTable('vendors').onDelete('CASCADE');
    table.decimal('amount',10,2).notNullable();
    table.string('status').notNullable().defaultTo('requested'); // requested, processed, paid
    table.jsonb('meta').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.table('vendors', t => {
    t.decimal('commission_rate',5,2).defaultTo(10.0); // percent default 10%
    t.decimal('balance',14,2).defaultTo(0.00);
    t.string('payout_details').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.table('vendors', t => {
    t.dropColumn('commission_rate');
    t.dropColumn('balance');
    t.dropColumn('payout_details');
  });
  await knex.schema.dropTableIfExists('payouts');
  await knex.schema.dropTableIfExists('vendor_admins');
};
