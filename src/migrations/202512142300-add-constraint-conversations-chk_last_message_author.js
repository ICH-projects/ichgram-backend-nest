export const up = async (queryInterface, Sequelize) => {
  await queryInterface.sequelize.query(`
      ALTER TABLE "Conversations"
      ADD CONSTRAINT "chk_last_message_author"
      CHECK (
        "lastMessageAuthorId" = "participant1Id"
        OR
        "lastMessageAuthorId" = "participant2Id"
      );
    `);
}

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.sequelize.query(`
      ALTER TABLE "Conversations"
      DROP CONSTRAINT "chk_last_message_author";
    `);
}

