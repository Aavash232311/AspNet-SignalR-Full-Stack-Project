import "../../static/auth/notify.css";
import React, { Component } from 'react';
import {
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Box,
    Paper,
    IconButton
} from '@mui/material';
import FeedIcon from '@mui/icons-material/Feed';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SideNavPost from "./useable/SideNavPost";
import Services from "../../utils/utils";
import ClearIcon from '@mui/icons-material/Clear';

class Notification extends Component {

    constructor(props) {
        super(props);
    }

    state = {
        page: 1,
        totalObjects: 1,
        totalObjects: 1,
        notification: []
    }

    services = new Services();

    getNotifications = (page) => {
        fetch(`Confession/notification?page=${page}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "GET",
        }).then((r) => r.json()).then((response) => {
            const { statusCode, value } = response;
            if (statusCode === 200) {
                const { data, totalObjects, totalPages } = value;
                this.setState({
                    notification: data,
                    totalObjects,
                    totalPages
                });
                return;
            }

        });
    }

    componentDidMount() {
        this.getNotifications(this.state.page);
    }

    clearNotification = (id) => {
        fetch(`Confession/clear-notification?notificationId=${id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.services.accessToken()}`,
            },
            method: "delete",
        }).then((r) => r.json()).then((response) => {
            const { statusCode } = response;
            if (statusCode === 200) {
                this.getNotifications(this.state.page);
                return;
            }
            alert("Something wen't wrong!");
        })
    }

    render() {
        const sampleNotification = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            title: "New Feed Update",
            message: "A new post has been added to your primary feed. Check it out now!",
            createdAt: "2025-12-24T16:14:00Z",
            isRead: false,
            type: "feed",
            commentId: null,
            userId: "user_123"
        };

        const isUnread = !sampleNotification.isRead;

        /* Now there are two case in this situatation.
           
            If the user is in another page, that is using the same side nav then, he will click on this page
            and then componenentDidMount() get's called which will re-fetch data from the server.

            But what if user is in the same page. We need to add the notification accordingly.
        
        */

        return (
            <SideNavPost>
                {this.state.notification.length > 0 ? (
                    <>
                        <Typography variant="h6" style={{ flexGrow: 1 }}>
                            Notifications
                        </Typography>
                        {this.state.notification.map((object, index) => {
                            return (
                                <React.Fragment key={index}>
                                    <Paper
                                        elevation={3}
                                        sx={{
                                            maxWidth: 450,
                                            m: 2, // Margin to prevent sticking to edges
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            // Visual accent: blue bar on the left for unread notifications
                                            borderLeft: isUnread ? '5px solid' : '1px solid',
                                            borderColor: isUnread ? 'primary.main' : 'divider',
                                            bgcolor: 'background.paper',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: 6,
                                            }
                                        }}
                                    >
                                        <ListItem
                                            alignItems="flex-start"
                                            secondaryAction={
                                                <IconButton onClick={() => {
                                                    this.clearNotification(object.id);
                                                }} edge="end" size="small">
                                                    <ClearIcon />
                                                </IconButton>
                                            }
                                            sx={{ py: 2 }}
                                        >
                                            <ListItemAvatar sx={{ minWidth: 56 }}>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: isUnread ? 'primary.light' : 'grey.200',
                                                        color: isUnread ? 'primary.main' : 'grey.600',
                                                        width: 42,
                                                        height: 42
                                                    }}
                                                >
                                                    <FeedIcon />
                                                </Avatar>
                                            </ListItemAvatar>

                                            <ListItemText
                                                primary={
                                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                        <Typography variant="subtitle2" fontWeight={700}>
                                                            {object.title}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {this.services.aspDateHourMinutes(object.createdAt)}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        lineHeight={1.4}
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {object.message}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    </Paper>
                                </React.Fragment>
                            )
                        })}
                    </>
                ) : (
                    <>
                        <Typography variant="h6" style={{ flexGrow: 1 }}>
                            No notifications for you!
                        </Typography>
                    </>
                )}
            </SideNavPost>
        );
    }
}

export default Notification;