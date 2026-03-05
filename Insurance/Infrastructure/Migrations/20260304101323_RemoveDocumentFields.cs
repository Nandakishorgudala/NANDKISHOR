using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDocumentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_PolicyApplications_PolicyProductId",
                table: "PolicyApplications",
                column: "PolicyProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Agents_UserId",
                table: "Agents",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Agents_Users_UserId",
                table: "Agents",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PolicyApplications_PolicyProducts_PolicyProductId",
                table: "PolicyApplications",
                column: "PolicyProductId",
                principalTable: "PolicyProducts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Agents_Users_UserId",
                table: "Agents");

            migrationBuilder.DropForeignKey(
                name: "FK_PolicyApplications_PolicyProducts_PolicyProductId",
                table: "PolicyApplications");

            migrationBuilder.DropIndex(
                name: "IX_PolicyApplications_PolicyProductId",
                table: "PolicyApplications");

            migrationBuilder.DropIndex(
                name: "IX_Agents_UserId",
                table: "Agents");
        }
    }
}
