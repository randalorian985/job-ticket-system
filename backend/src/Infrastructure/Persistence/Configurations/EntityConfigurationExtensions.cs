using JobTicketSystem.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JobTicketSystem.Infrastructure.Persistence.Configurations;

internal static class EntityConfigurationExtensions
{
    public static void ConfigureAuditableEntity<TEntity>(this EntityTypeBuilder<TEntity> builder)
        where TEntity : AuditableEntity
    {
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.CreatedAtUtc).IsRequired();
        builder.Property(entity => entity.UpdatedAtUtc).IsRequired();
    }

    public static void ConfigureSoftDelete<TEntity>(this EntityTypeBuilder<TEntity> builder)
        where TEntity : SoftDeletableEntity
    {
        builder.Property(entity => entity.IsDeleted).HasDefaultValue(false).IsRequired();
        builder.Property(entity => entity.DeletedAtUtc);
        builder.Property(entity => entity.DeletedByUserId);
        builder.HasQueryFilter(entity => !entity.IsDeleted);
    }
}
