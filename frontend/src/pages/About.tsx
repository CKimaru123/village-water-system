import React from "react";
import { useTranslation } from "react-i18next";


interface AboutProps {
  data?: {
    paragraph: string;
    Why: string[];
    Why2: string[];
  };
}

export const About: React.FC<AboutProps> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <div id="about">
      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-6">
            <img src="img/about.jpg" className="img-responsive" alt="About" />
          </div>
          <div className="col-xs-12 col-md-6">
            <div className="about-text">
              <h2>About Us</h2>
              <p>{data ? data.paragraph : "loading..."}</p>
              <h3>Why Choose Us?</h3>
              <div className="list-style">
                <div className="col-lg-6 col-sm-6 col-xs-12">
                  <ul>
                    {data
                      ? data.Why.map((d, i) => <li key={`${d}-${i}`}>{d}</li>)
                      : t("Loading")}
                  </ul>
                </div>
                <div className="col-lg-6 col-sm-6 col-xs-12">
                  <ul>
                    {data
                      ? data.Why2.map((d, i) => <li key={`${d}-${i}`}>{d}</li>)
                      : t("Loading")}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
