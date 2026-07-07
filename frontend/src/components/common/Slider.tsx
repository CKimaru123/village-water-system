import React from "react";
import Slider from "react-slick";
import slider1 from "../../assets/images/slider/slider1.jpg";
import slider2 from "../../assets/images/slider/slider2.jpg";
import slider3 from "../../assets/images/slider/slider3.jpg";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const SliderComponent: React.FC = () => {
  const slides = [slider1, slider2, slider3];

  const CustomPrevArrow: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
    <div className="custom-arrow custom-prev" onClick={onClick}>
      <FaChevronLeft />
    </div>
  );

  const CustomNextArrow: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
    <div className="custom-arrow custom-next" onClick={onClick}>
      <FaChevronRight />
    </div>
  );

  const settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
  };

  return (
    <div
      className="slider-wrapper"
      style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}
    >
      <Slider {...settings} className="slider">
        {slides.map((slide, index) => (
          <div
            key={index}
            className="slide"
            style={{ position: "relative", textAlign: "center" }}
          >
            <img
              src={slide}
              alt={`Slide ${index + 1}`}
              style={{ width: "100%", height: "600px", objectFit: "cover" }}
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default SliderComponent;
