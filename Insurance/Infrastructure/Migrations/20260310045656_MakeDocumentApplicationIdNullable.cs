using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeDocumentApplicationIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ApplicationDocuments_PolicyApplications_PolicyApplicationId",
                table: "ApplicationDocuments");

            migrationBuilder.DropIndex(
                name: "IX_ApplicationDocuments_PolicyApplicationId",
                table: "ApplicationDocuments");

            migrationBuilder.AlterColumn<int>(
                name: "PolicyApplicationId",
                table: "ApplicationDocuments",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationDocuments_PolicyApplicationId",
                table: "ApplicationDocuments",
                column: "PolicyApplicationId",
                unique: true,
                filter: "[PolicyApplicationId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_ApplicationDocuments_PolicyApplications_PolicyApplicationId",
                table: "ApplicationDocuments",
                column: "PolicyApplicationId",
                principalTable: "PolicyApplications",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ApplicationDocuments_PolicyApplications_PolicyApplicationId",
                table: "ApplicationDocuments");

            migrationBuilder.DropIndex(
                name: "IX_ApplicationDocuments_PolicyApplicationId",
                table: "ApplicationDocuments");

            migrationBuilder.AlterColumn<int>(
                name: "PolicyApplicationId",
                table: "ApplicationDocuments",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationDocuments_PolicyApplicationId",
                table: "ApplicationDocuments",
                column: "PolicyApplicationId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ApplicationDocuments_PolicyApplications_PolicyApplicationId",
                table: "ApplicationDocuments",
                column: "PolicyApplicationId",
                principalTable: "PolicyApplications",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
