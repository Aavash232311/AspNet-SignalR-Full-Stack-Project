using System;
using System.Reflection;

namespace CollegeApp.Server.Service
{
    public class Helper
    {
        Random random = new Random();
        public string RandomRGB()
        {
            int r = random.Next(256); // 0–255
            int g = random.Next(256);
            int b = random.Next(256);

            return $"rgb({r}, {g}, {b})";
        }
        
        public dynamic NormalPagination(int pageSize, int page, IQueryable<dynamic> dbo) // this is for the normal pagination that takes place 
        {
            try
            {
                var totalObjects = dbo.Count();
                var takeSkip = dbo.Skip((page - 1) * pageSize).Take(pageSize).ToList();
                int totalPages = (int)Math.Ceiling(totalObjects / (double)pageSize);
                return new { totalPages, data = takeSkip, totalObjects };
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }
    }
}
