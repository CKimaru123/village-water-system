import React from 'react'
import { articles } from '../../data/data/index'

interface ArticlesProp {
    title: string
    limit: number
}

const Articles: React.FC<ArticlesProp> = ({title, limit = 7}) => {

    const dislayedArticles = articles.slice(0, limit)
    return (
        <div className='articles'>
            <div className='container'>
                <h2>{title}</h2>
                <div className='posts'>
                    {dislayedArticles.map((article) => (
                        <div className='post' key={article.id}>
                            <div>
                                <img src={article.image} alt="" />
                            </div>
                            <header>
                                <div className='date'>{article.date}</div>
                                <h3>{article.title}</h3>
                                <div className='tags'>
                                    {article.tags.map((tag, index) => (
                                        <a key={index}>{tag}</a>
                                    ))}
                                </div>
                            </header>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Articles;
