FROM mcr.microsoft.com/dotnet/sdk:8.0.100 AS build
WORKDIR /src

# Copy solution and restore
COPY . ./
RUN dotnet restore "JobTicketSystem.sln"

# Publish the Api project
RUN dotnet publish "src/Api/Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish ./

ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "Api.dll"]
