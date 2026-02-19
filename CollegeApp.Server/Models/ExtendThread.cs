namespace CollegeApp.Server.Models
{
    /* 
     Okay this is for scaling our thread.
    So we have hard limitation on the thread.

    Considering this application blows up the internet other day, 
    And me with refusal from 100 company with 6 years of programming as a
    freshman goes viral. 

    Will my application break?
    -> well it shouldn't cause I am not a mid 💪 

    We don't want the data redundancy, so we will just reference the confession 
     */
    public class ExtendThread
    {
        public Guid Id { get; set; }
        public Confession? Confession { get; set; } // This is what we are referencing to "Root Node"
        public Guid? ConfessionId { get; set; }
        public int page { get; set; } = 1; // default one
        /*
            Now we need to figure out for making this top order comment
        so that we can re-use the client side.

        Clever strategy without data redundancy,
        we will modify things in API, now when we say continue in thread,
        we need that parent thread, and that will be the top thread, you're getting it 
        (Explaining it like someone from Microsoft is looking at it)
        Of course we will set the limiter (Hard number) 

        */
    }
}
