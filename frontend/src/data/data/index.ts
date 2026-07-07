import blog1 from "../../assets/images/slider/blog1.jpg";
import blog2 from "../../assets/images/slider/blog2.jpg";
import blog3 from "../../assets/images/slider/blog3.jpg";
import blog4 from "../../assets/images/slider/blog4.jpg";
import blog5 from "../../assets/images/slider/blog5.jpg";
import blog6 from "../../assets/images/slider/blog6.jpg";
import blog7 from "../../assets/images/slider/blog7.jpg";
import blog8 from "../../assets/images/slider/blog8.jpg";
import blog9 from "../../assets/images/slider/blog9.jpg";
import blog10 from "../../assets/images/slider/blog10.jpg";
import { FaInstagram, FaLinkedin, FaPinterest } from "react-icons/fa";
import { FaFacebookF, FaXTwitter } from "react-icons/fa6";
import { IconType } from "react-icons";

interface Blog {
  id: number;
  date: string;
  title: string;
  tags: string[];
  image: string;
  content: string;
  icons: IconType[];
}

interface Article {
  id: number;
  date: string;
  title: string;
  tags: string[];
  image: string;
}

export const blogs: Blog[] = [
  {
    id: 1,
    date: "January 30, 2025",
    title: "10 Simple Habits for a Healthier Lifestyle",
    tags: ["#habits", "#healthy", "#life", "#lifestyle"],
    image: blog2,
    content:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit Exercitationem ipsa quaerat ut ipsam vero, beatae repudiandaemagnam cupiditate cumque, quis dolorum. Ipsam fugiat aperiam dolores explicabo reprehenderit expedita placeat iure.",
    icons: [FaPinterest, FaFacebookF, FaInstagram, FaXTwitter, FaLinkedin],
  },
  {
    id: 2,
    date: "January 28, 2025",
    title: "The Best Snowy Landscapes to Photograph This Winter",
    tags: ["#winter", "#snow", "#landscapes", "#photograph"],
    image: blog1,
    content:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit Exercitationem ipsa quaerat ut ipsam vero, beatae repudiandaemagnam cupiditate cumque, quis dolorum. Ipsam fugiat aperiam dolores explicabo reprehenderit expedita placeat iure.",
    icons: [FaPinterest, FaFacebookF, FaInstagram, FaXTwitter, FaLinkedin],
  },
  {
    id: 3,
    date: "January 25, 2025",
    title: "Hidden Gems Around the World You Must Explore",
    tags: ["#gems", "#travel", "#world", "#adventure"],
    image: blog3,
    content:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit Exercitationem ipsa quaerat ut ipsam vero, beatae repudiandaemagnam cupiditate cumque, quis dolorum. Ipsam fugiat aperiam dolores explicabo reprehenderit expedita placeat iure.",
    icons: [FaPinterest, FaFacebookF, FaInstagram, FaXTwitter, FaLinkedin],
  },
];

export const articles: Article[] = [
  {
    id: 1,
    date: "January 25, 2025",
    title: "The Science Behind Mindfulness and Meditation",
    tags: ["#science", "#health", "#lifestyle", "#meditation"],
    image: blog4,
  },
  {
    id: 2,
    date: "January 25, 2025",
    title: "How to Build a Productive Morning Routine",
    tags: ["#morning", "#health", "#lifestyle", "#routine"],
    image: blog5,
  },
  {
    id: 3,
    date: "January 25, 2025",
    title: "Top 10 Destinations to Visit This Year",
    tags: ["#destinations", "#travel", "#world", "#adventure"],
    image: blog6,
  },
  {
    id: 4,
    date: "January 25, 2025",
    title: "Work-Life Balance Tips for a Happier Life",
    tags: ["#work", "#life", "#happy"],
    image: blog7,
  },
  {
    id: 5,
    date: "January 25, 2025",
    title: "10 Quick and Healthy Meals for Busy Weekdays",
    tags: ["#food", "#healthy", "#meals", "#lifestyle"],
    image: blog8,
  },
  {
    id: 6,
    date: "January 25, 2025",
    title: "Must-Read Books for Personal Growth and Development",
    tags: ["#books", "#growth", "#development", "#lifestyle"],
    image: blog9,
  },
  {
    id: 7,
    date: "January 25, 2025",
    title: "How AI is Transforming the Future of Work",
    tags: ["#ai", "#science", "#future", "#work"],
    image: blog10,
  },
];
