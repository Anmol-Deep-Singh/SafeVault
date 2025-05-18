import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Container,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Paper,
    Divider,
    Badge,
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    CircularProgress,
    Pagination
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Email as EmailIcon,
    EmailOutlined as EmailOutlinedIcon,
    NavigateNext as NavigateNextIcon,
    NavigateBefore as NavigateBeforeIcon
} from '@mui/icons-material';

const EmailInbox = () => {
    const [emails, setEmails] = useState([]);
    const [currentEmail, setCurrentEmail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [unreadCount, setUnreadCount] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);

    // Fetch emails
    const fetchEmails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/admin/emails?page=${page}&limit=10`);
            setEmails(response.data.emails);
            setTotalPages(response.data.totalPages);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch emails:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, [page]);

    // Handle email selection
    const handleEmailClick = async (email) => {
        setCurrentEmail(email);
        setOpenDialog(true);
        
        if (!email.isRead) {
            try {
                await axios.patch(`/api/admin/emails/${email._id}/read`);
                fetchEmails(); // Refresh to update unread count
            } catch (error) {
                console.error('Failed to mark email as read:', error);
            }
        }
    };

    // Handle email deletion
    const handleDeleteEmail = async (emailId) => {
        try {
            await axios.delete(`/api/admin/emails/${emailId}`);
            setOpenDialog(false);
            fetchEmails();
        } catch (error) {
            console.error('Failed to delete email:', error);
        }
    };

    // Handle navigation between emails
    const handleNextEmail = () => {
        const currentIndex = emails.findIndex(e => e._id === currentEmail._id);
        if (currentIndex < emails.length - 1) {
            handleEmailClick(emails[currentIndex + 1]);
        }
    };

    const handlePreviousEmail = () => {
        const currentIndex = emails.findIndex(e => e._id === currentEmail._id);
        if (currentIndex > 0) {
            handleEmailClick(emails[currentIndex - 1]);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box mb={4}>
                <Typography variant="h4" gutterBottom>
                    Admin Inbox
                    {unreadCount > 0 && (
                        <Badge 
                            badgeContent={unreadCount} 
                            color="error" 
                            sx={{ marginLeft: 2 }}
                        >
                            <EmailIcon />
                        </Badge>
                    )}
                </Typography>
            </Box>

            <Paper elevation={3}>
                <List>
                    {emails.map((email) => (
                        <React.Fragment key={email._id}>
                            <ListItem
                                button
                                onClick={() => handleEmailClick(email)}
                                sx={{
                                    backgroundColor: email.isRead ? 'inherit' : 'action.hover'
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center">
                                            {email.isRead ? (
                                                <EmailOutlinedIcon sx={{ mr: 1 }} />
                                            ) : (
                                                <EmailIcon sx={{ mr: 1 }} color="primary" />
                                            )}
                                            <Typography
                                                variant="subtitle1"
                                                color={email.severity === 'HIGH' ? 'error' : 'inherit'}
                                                fontWeight={!email.isRead ? 'bold' : 'normal'}
                                            >
                                                {email.subject}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={new Date(email.createdAt).toLocaleString()}
                                />
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))}
                </List>

                <Box display="flex" justifyContent="center" p={2}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(e, value) => setPage(value)}
                        color="primary"
                    />
                </Box>
            </Paper>

            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
            >
                {currentEmail && (
                    <>
                        <DialogContent>
                            <Typography variant="h6" gutterBottom>
                                {currentEmail.subject}
                            </Typography>
                            <Typography variant="caption" display="block" gutterBottom>
                                {new Date(currentEmail.createdAt).toLocaleString()}
                            </Typography>
                            <Box mt={2} dangerouslySetInnerHTML={{ __html: currentEmail.content }} />
                        </DialogContent>
                        <DialogActions>
                            <Button
                                startIcon={<NavigateBeforeIcon />}
                                onClick={handlePreviousEmail}
                                disabled={emails.indexOf(currentEmail) === 0}
                            >
                                Previous
                            </Button>
                            <Button
                                endIcon={<NavigateNextIcon />}
                                onClick={handleNextEmail}
                                disabled={emails.indexOf(currentEmail) === emails.length - 1}
                            >
                                Next
                            </Button>
                            <Button
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDeleteEmail(currentEmail._id)}
                                color="error"
                            >
                                Delete
                            </Button>
                            <Button onClick={() => setOpenDialog(false)}>
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Container>
    );
};

export default EmailInbox; 