import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { blogs } from '../../data/data/index'
import Articles from './Articles';

const SingleBlog: React.FC = () => {
    const { id } = useParams<{ id: string}>();

    const blog = blogs.find((blog) => blog.id === parseInt(id!));

    useEffect(() => {
        window.scrollTo(0,0);
    }, []);

    return (
        <div className='single-blog'>
            <div className='container'>
                <div className='blog'>
                    <header>
                        <h2>{blog?.title}</h2>
                    </header>
                    <div className='image'>
                        <img src={blog?.image} alt="" />
                    </div>
                    <div className='info'>
                        <span>
                            Author: <span>Collins K.</span>
                        </span>
                        <span>{blog?.date}</span>
                    </div>
                    <div className='content'>
                        <p>
                           Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?
                           <br />
                           <br />
                           Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum 
                        </p>
                    </div>
                    <div className='share'>
                        <ul>
                            <label>Share</label>
                            {blog?.icons.map((Icon, index) => (
                                <li key={index}>
                                    <a><Icon /></a>
                                </li>
                            ))}
                        </ul>
                        <div className='comments'>4 comments</div>
                    </div>
                </div>
                <Articles title="Related Posts" limit={3} />
            </div>
        </div>
    )
}

export default SingleBlog;
