var builder = DistributedApplication.CreateBuilder(args);

builder.AddProject<Projects.CollegeApp_Server>("collegeapp-server");

builder.Build().Run();
