import React from "react";
import { useTranslation } from "react-i18next";

interface Service {
  icon: string;
  name: string;
  text: string;
}

interface ServicesProps {
  data?: Service[];
}

export const Services: React.FC<ServicesProps> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <div id="services" className="text-center">
      <div className="container">
        <div className="section-title">
          <h2>{t("Our Services")}</h2>
          <p>
            {t("ServicesIntro")}
          </p>
        </div>
        <div className="row">
          {data
            ? data.map((d, i) => (
                <div key={`${d.name}-${i}`} className="col-md-4">
                  <i className={d.icon}></i>
                  <div className="service-desc">
                    <h3>{d.name}</h3>
                    <p>{d.text}</p>
                  </div>
                </div>
              ))
            : t("Loading")}
        </div>
      </div>
    </div>
  );
};
