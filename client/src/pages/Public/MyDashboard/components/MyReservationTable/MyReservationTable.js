import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Snackbar,
  Button
} from '@material-ui/core';
import { Portlet, PortletContent } from '../../../../../components';
import styles from './styles';
import { withRouter } from 'react-router-dom'; // Import withRouter
import jsPDF from 'jspdf';
import QRCode from 'qrcode';


class ReservationsTable extends Component {
  state = {
    rowsPerPage: 10,
    page: 0,
    alertOpen: false,
    alertMessage: ''
  };

  componentDidMount() {
    const { location } = this.props;
    const query = new URLSearchParams(location.search);
    const message = query.get('message');

    if (message) {
      this.setState({ alertOpen: true, alertMessage: message });
    }
  }

  handleCloseAlert = () => {
    this.setState({ alertOpen: false });
  };

  static propTypes = {
    className: PropTypes.string,
    classes: PropTypes.object.isRequired,
    onSelect: PropTypes.func,
    onShowDetails: PropTypes.func,
    reservations: PropTypes.array.isRequired,
    movies: PropTypes.array.isRequired,
    cinemas: PropTypes.array.isRequired,
    location: PropTypes.object.isRequired // Add location prop
  };

  static defaultProps = {
    reservations: [],
    movies: [],
    cinemas: [],
    onSelect: () => { },
    onShowDetails: () => { }
  };

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  };

  onFindAttr = (id, list, attr) => {
    const item = list.find(item => item._id === id);
    return item ? item[attr] : `Not ${attr} Found`;
  };

  jsPdfGenerator = async (reservation) => {
    const { date, startAt, seats } = reservation;

    const doc = new jsPDF({
      format: 'a5',
      orientation: 'portrait', // 'portrait' or 'landscape'
    });
    const title = this.onFindAttr(reservation.movieId, this.props.movies, 'title');
    const cinema = this.onFindAttr(reservation.cinemaId, this.props.cinemas, 'name');

    console.log(seats);
    // Set font and styles

    doc.setFont('helvetica');
    doc.setFontType('bold');
    doc.setFontSize(22);
    doc.text(`${title.toUpperCase()}`, 20, 20);
    doc.setFontSize(16);
    doc.text(cinema, 20, 30);
    doc.text(`Date: ${new Date(date).toLocaleDateString()} - Time: ${startAt}`, 20, 40);
    doc.setFontType("normal");
    doc.setFontSize(13);
    doc.text(`Number of Tickets: ${seats.length}`, 20, 50);

    try {
      // Format the string to encode
      // Create a JSON object with the movie details
      const qrCodeData = JSON.stringify({
        movie: title,
        cinema: cinema,
        date: date,
        time: startAt
      });
      // Generate the QR code data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
        width: 150, // Set the width of the QR code
        margin: 1,  // Set the margin around the QR code
      });

      // console.log(qrCodeDataUrl); // This will log the data URL string
      const pageWidth = doc.internal.pageSize.getWidth();

      // Set the dimensions for the image (you can adjust them as per your requirement)
      const imgWidth = 80;  // Width of the image

      // Calculate x-coordinate to center the image horizontally
      const x = (pageWidth - imgWidth) / 2;
      const y = 60;
      doc.addImage(qrCodeDataUrl, 'PNG', x, y, imgWidth, imgWidth); // Add the QR code image to the PDF x,y,size 160*160
      doc.setFontType('bold');
      doc.setFontSize(14);
      doc.text('Enjoy your movie experience at LCC Multiplex.', 20, 155);
    } catch (error) {
      console.error('Error generating QR Code:', error);
    }
    doc.save(`${title}-${cinema}.pdf`);
  };

  handleDownload = (reservation) => {
    this.jsPdfGenerator(reservation);
  };

  render() {
    const { classes, className, reservations, movies, cinemas } = this.props;
    const { rowsPerPage, page, alertOpen, alertMessage } = this.state;
    const rootClassName = classNames(classes.root, className);

    return (
      <Portlet className={rootClassName}>
        <PortletContent noPadding>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="left">Movie</TableCell>
                <TableCell align="left">Cinema</TableCell>
                <TableCell align="left">Date</TableCell>
                <TableCell align="left">Start At</TableCell>
                <TableCell align="left">Ticket Price</TableCell>
                <TableCell align="left">Total</TableCell>
                <TableCell align="left">Payment Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(reservation => (
                  <TableRow
                    className={classes.tableRow}
                    hover
                    key={reservation._id}>
                    <TableCell className={classes.tableCell}>
                      {this.onFindAttr(reservation.movieId, movies, 'title')}
                    </TableCell>
                    <TableCell className={classes.tableCell}>
                      {this.onFindAttr(reservation.cinemaId, cinemas, 'name')}
                    </TableCell>
                    <TableCell className={classes.tableCell}>
                      {new Date(reservation.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className={classes.tableCell}>
                      {reservation.startAt}
                    </TableCell>
                    <TableCell className={classes.tableCell}>
                      {reservation.ticketPrice}
                    </TableCell>
                    <TableCell className={classes.tableCell}>
                      {reservation.total}
                    </TableCell>
                    <TableCell className={classes.tableCell}>
                      <b style={{ textTransform: 'capitalize' }}> {reservation.paymentStatus}</b>
                      {reservation.paymentStatus === 'paid' && (
                        <button
                          onClick={() => this.handleDownload(reservation)}
                          style={{
                            padding: '10px 10px',
                            marginLeft: '5px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            transition: 'background-color 0.3s ease'
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#45a049')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4CAF50')}
                        >
                          Download Ticket
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            backIconButtonProps={{
              'aria-label': 'Previous Page'
            }}
            component="div"
            count={reservations.length}
            nextIconButtonProps={{
              'aria-label': 'Next Page'
            }}
            onChangePage={this.handleChangePage}
            onChangeRowsPerPage={this.handleChangeRowsPerPage}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </PortletContent>

        {/* Snackbar for alert */}
        <Snackbar
          open={alertOpen}
          onClose={this.handleCloseAlert}
          message={alertMessage}
          action={
            <button color="inherit" onClick={this.handleCloseAlert}>
              X
            </button>
          }
          ContentProps={{
            style: {
              backgroundColor: 'green', // Green background
              color: 'white' // White text color
            }
          }}
          anchorOrigin={{
            vertical: 'top', // Position at the top
            horizontal: 'right' // Position at the right
          }}
        />
      </Portlet>
    );
  }
}

// Wrap withRouter to gain access to the location prop
export default withRouter(withStyles(styles)(ReservationsTable));
