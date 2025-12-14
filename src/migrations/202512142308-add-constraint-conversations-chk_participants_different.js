export const up = async (queryInterface, Sequelize) => {
  await queryInterface.sequelize.query(`
  ALTER TABLE "Conversations"
  ADD CONSTRAINT "chk_participants_different"
  CHECK ("participant1Id" <> "participant2Id");
`);
}

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.sequelize.query(`
      ALTER TABLE "Conversations"
      DROP CONSTRAINT "chk_participants_different";
    `);
}

