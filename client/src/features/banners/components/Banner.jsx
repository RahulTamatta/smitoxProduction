import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from './Banner.module.css'; // migrated to CSS module
import React from 'react';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import gadgetSale from '../../../src/assets/images/Banners/gadget-sale.jpg';
import kitchenSale from '../../../src/assets/images/Banners/kitchen-sale.jpg';
import poco from '../../../src/assets/images/Banners/poco-m4-pro.webp';
import realme from '../../../src/assets/images/Banners/fashion-sale.webp';
import fashionSale from '../../../src/assets/images/Banners/fashionsale.jpg';
import oppo from '../../../src/assets/images/Banners/oppo-reno7.webp';


export const PreviousBtn = ({ className, onClick }) => {
  return (
    <div className={className} onClick={onClick}>
      <ArrowBackIosIcon />
    </div>
  )
}

export const NextBtn = ({ className, onClick }) => {
  return (
    <div className={className} onClick={onClick}>
      <ArrowForwardIosIcon />
    </div>
  )
}


// const banners = [gadgetSale, kitchenSale, poco, fashionSale, realme, oppo];

// const Banner = () => {
//   const settings = {
//     autoplay: true,
//     autoplaySpeed: 2000,
//     dots: false,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     prevArrow: <PreviousBtn />,
//     nextArrow: <NextBtn />,
//   };

//   return (
//     <section className="h-44 sm:h-72 w-full rounded-sm shadow relative overflow-hidden">
//       <Slider {...settings}>
//         {banners.map((el, i) => (
//           <img draggable="false" className="h-44 sm:h-72 w-full object-cover" src={el} alt={`banner-${i}`} key={i} />
//         ))}
//       </Slider>
//     </section>
//   );
// };

// export default Banner;