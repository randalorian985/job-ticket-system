using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMailerConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MailerConfigurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Provider = table.Column<int>(type: "int", nullable: false),
                    Enabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    FromName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    FromAddress = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: true),
                    ReplyToAddress = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: true),
                    SmtpHost = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    SmtpPort = table.Column<int>(type: "int", nullable: false, defaultValue: 587),
                    SmtpEnableSsl = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    SmtpUsername = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: true),
                    SmtpPasswordCipherText = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    AppBaseUrl = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    LastTestedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastTestSucceeded = table.Column<bool>(type: "bit", nullable: true),
                    LastTestMessage = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MailerConfigurations", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MailerConfigurations_UpdatedAtUtc",
                table: "MailerConfigurations",
                column: "UpdatedAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MailerConfigurations");
        }
    }
}
