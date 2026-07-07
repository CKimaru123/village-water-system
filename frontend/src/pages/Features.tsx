import React from "react";
import { useTranslation } from "react-i18next";

// 🔹 Define the shape of a feature
interface Feature {
  title: string;
  text: string;
  icon: string;
}

// 🔹 Props for the component
interface FeaturesProps {
  data?: Feature[];
}

export const Features: React.FC<FeaturesProps> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <div id="features" className="text-center">
      <div className="container" style={{paddingTop: "120px", paddingBottom: "140px"}}>
        <div className="col-md-10 col-md-offset-1 section-title">
          <h2>Features</h2>
        </div>
        <div className="row">
          {data
            ? data.map((d, i) => (
                <div key={`${d.title}-${i}`} className="col-xs-6 col-md-3">
                  <i className={d.icon}></i>
                  <h3>{d.title}</h3>
                  <p>{d.text}</p>
                </div>
              ))
            : t("Loading...")}
        </div>
      </div>
    </div>
  );
};
