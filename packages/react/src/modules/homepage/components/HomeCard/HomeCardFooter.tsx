import { ReactNode } from 'react';

export type HomeCardFooterProps = {
  children: ReactNode;
};

const HomeCardFooter = ({ children }: HomeCardFooterProps) => {
  return <div className="home-card-footer">{children}</div>;
};

HomeCardFooter.displayName = 'HomeCard.Footer';

export default HomeCardFooter;
