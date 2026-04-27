namespace JobTicketSystem.Infrastructure.Storage;

public interface IFileStorageProvider
{
    string GenerateStorageKey(Guid jobTicketId, string originalFileName, string extension);
    Task SaveAsync(string storageKey, Stream content, CancellationToken cancellationToken = default);
    Task<Stream> OpenReadAsync(string storageKey, CancellationToken cancellationToken = default);
}
