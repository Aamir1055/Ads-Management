/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('campaigns', function(table) {
    // Add brand_id column as foreign key to brands table
    table.integer('brand_id').unsigned().references('id').inTable('brands');
    
    // Add index for brand_id
    table.index(['brand_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('campaigns', function(table) {
    // Remove the brand_id column
    table.dropColumn('brand_id');
  });
};
