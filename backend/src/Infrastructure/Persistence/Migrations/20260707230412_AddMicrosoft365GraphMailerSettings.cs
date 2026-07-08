using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMicrosoft365GraphMailerSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Microsoft365ClientId",
                table: "MailerConfigurations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Microsoft365ClientSecretCipherText",
                table: "MailerConfigurations",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Microsoft365SenderEmail",
                table: "MailerConfigurations",
                type: "nvarchar(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Microsoft365TenantId",
                table: "MailerConfigurations",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Microsoft365ClientId",
                table: "MailerConfigurations");

            migrationBuilder.DropColumn(
                name: "Microsoft365ClientSecretCipherText",
                table: "MailerConfigurations");

            migrationBuilder.DropColumn(
                name: "Microsoft365SenderEmail",
                table: "MailerConfigurations");

            migrationBuilder.DropColumn(
                name: "Microsoft365TenantId",
                table: "MailerConfigurations");
        }
    }
}
