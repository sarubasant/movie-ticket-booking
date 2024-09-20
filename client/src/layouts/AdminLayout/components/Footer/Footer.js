import React from 'react';
import { Divider, Typography, Link } from '@material-ui/core';
import useStyles from './styles';

export default function Footer() {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Divider />
      <Typography className={classes.copyright} variant="body1">
        &copy; Lumbini City College, 2024
      </Typography>
      <Typography variant="caption">
        Created by |{' '}
        <Link href="http://github.com/sarubasant" target="_blank" rel="noopener">
          Basanta Saru & Sagun Khatri
        </Link>
      </Typography>
    </div>
  );
}
