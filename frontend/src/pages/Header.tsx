import React from "react";
import { useTranslation } from "react-i18next";

interface HeaderProps {
  data?: {
    title: string;
    paragraph: string;
  };
}

export const Header: React.FC<HeaderProps> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <header id="header">
      <div className="intro">
        <div className="overlay">
          <div className="container">
            <div className="row">
              <div className="col-md-8 col-md-offset-2 intro-text">
                <h1>
                  {data ? data.title : t("Loading")}
                  <span></span>
                </h1>
                <p>{data ? data.paragraph : t("Loading")}</p>
                <a
                  href="/#features"
                  className="btn btn-custom btn-lg page-scroll"
                >
                  {t("Learn More")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
