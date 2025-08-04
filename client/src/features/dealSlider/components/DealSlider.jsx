import React from 'react';
import Product from './Product';
import Slider from 'react-slick';
import { Link } from 'react-router-dom';
import { offerProducts } from '../../utils/constants';
import { getRandomProducts } from '../../utils/functions';

// Import css files for react-slick
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Custom CSS for Slick arrows
const slickArrowStyles = `
  .slick-prev, .slick-next {
    z-index: 1;
  }
  .slick-prev {
    left: 15px !important;
  }
  .slick-next {
    right: 15px !important;
  }
  .slick-prev:before, .slick-next:before {
    font-size: 24px;
    color: #000;
  }
`;


export const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 6,
    initialSlide: 1,
    swipe: false,
    arrows: true, // Enable default arrows
    responsive: [
        {
            breakpoint: 1024,
            settings: {
                slidesToShow: 3,
                slidesToScroll: 3
            }
        },
        {
            breakpoint: 600,
            settings: {
                slidesToShow: 2,
                slidesToScroll: 2
            }
        },
        {
            breakpoint: 480,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }
    ]
};

const DealSlider = ({ title }) => {
    return (
        <section className="bg-white w-full shadow overflow-hidden">
            {/* Inline style tag for Slick arrow styles */}
            <style>{slickArrowStyles}</style>
            
            {/* <!-- header --> */}
            <div className="flex px-6 py-3 justify-between items-center">
                <h1 className="text-xl font-medium">{title}</h1>
                <Link to="/products" className="bg-primary-blue text-xs font-medium text-white px-5 py-2.5 rounded-sm shadow-lg">VIEW ALL</Link>
            </div>
            <hr />
            {/* <!-- header --> */}

            <Slider {...settings}>
                {getRandomProducts(offerProducts, 12).map((item, i) => (
                    <Product {...item} key={i} />
                ))}
            </Slider>
        </section>
    );
};

export default DealSlider;