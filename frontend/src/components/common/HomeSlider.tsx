import React from 'react'
import { blogs } from '../../data/data/index'
import Articles from './Articles';
import { Link } from 'react-router-dom';

const HomeSlider: React.FC = () => {
  return (
    <div className='home-section'>
        <div className='container'>
            <div className='blogs'>
                {blogs.map((blog) => (
                    <div className='blog' key={blog.id}>
                        <header>
                            <div className='date'>{blog.date}</div>
                            <h2>{blog.title}</h2>
                            <div className='tags'>
                                {blog.tags.map((tag,index) => (
                                    <a key={index}>{tag}</a>
                                ))}
                            </div>
                        </header>
                        <div className='image'>
                            <img src={blog.image} alt="" />
                        </div>
                        <div className='content'>
                            <p>{blog.content}</p>
                        </div>
                        <div className='share'>
                            <ul>
                                <label>Share</label>
                                {blog.icons.map((Icon, index) => (
                                    <li key={index}>
                                        <a>
                                            <Icon />
                                        </a>
                                    </li>
                                ))}
                            </ul>

                            <Link to={`/blogs/${blog.id}`}className='read-more'>
                                Read More
                            </Link>
                            <div className='comments'>4 Comments</div>
                        </div>
                    </div>
                ))}
            </div>

            <Articles title='Recent Posts' limit = {3}  />
        </div>
    </div>
  );
};

export default HomeSlider