/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('email').notNullable().unique();
      table.string('passwordHash').notNullable();
      table.string('firstName');
      table.string('lastName');
      table.string('address');
      table.date('dob');
      table.timestamps(true, true);
    })
    .createTable('ratings', (table) => {
      table.increments('id').primary();
      table.integer('rental_id').unsigned().notNullable();
      table.integer('user_id').unsigned().notNullable();
      table.integer('rating').notNullable();
      table.text('comment');
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('ratings')
    .dropTableIfExists('users');
};
