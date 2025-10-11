using System;

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
    }
}
