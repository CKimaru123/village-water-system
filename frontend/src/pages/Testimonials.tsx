import React from "react";

interface Testimonial {
  name: string;
  img: string;
  text: string;
}

interface TestimonialsProps {
  data?: Testimonial[];
}

export const Testimonials: React.FC<TestimonialsProps> = ({ data }) => {
  return (
    <div id="testimonials">
      <div className="container">
        <div className="section-title text-center">
          <h2>What our clients say</h2>
        </div>
        <div className="row">
          {data
            ? data.map((d, i) => (
                <div key={`${d.name}-${i}`} className="col-md-4">
                  <div className="testimonial">
                    <div className="testimonial-image">
                      <img src={d.img} alt={d.name} />
                    </div>
                    <div className="testimonial-content">
                      <p>"{d.text}"</p>
                      <div className="testimonial-meta">- {d.name}</div>
                    </div>
                  </div>
                </div>
              ))
            : "loading"}
        </div>
      </div>
    </div>
  );
};
