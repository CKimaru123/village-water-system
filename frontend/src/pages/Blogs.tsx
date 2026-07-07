import React, { useEffect } from 'react'
import SliderComponent from '../components/common/Slider'
import HomeSlider from '../components/common/HomeSlider';

const Blogs: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on mount
  }, []); // Empty dependency array ensures it runs only once on mount

  return (
    <div className="logos">
      <h1>Burguret Water Project: Blogs</h1>
      {/* Removed <p>Blog</p> to reduce vertical space if not needed */}
      <SliderComponent />
      <HomeSlider />
    </div>
  )
}

export default Blogs