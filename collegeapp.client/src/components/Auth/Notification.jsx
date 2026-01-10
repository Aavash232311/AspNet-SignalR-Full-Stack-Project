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
    IconButton,
    Tooltip,
    Zoom
} from '@mui/material';
import FeedIcon from '@mui/icons-material/Feed';
import AuthContext from "../../auth/auth";
import SideNavPost from "./useable/SideNavPost";
import Services from "../../utils/utils";
import ClearIcon from '@mui/icons-material/Clear';
import Pagination from '@mui/material/Pagination';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

class Notification extends Component {

    constructor(props) {
        super(props);
    }

    state = {
        page: 1,
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
                if (this.state.notification.length <= 1 && this.state.page > 1) { 
                    this.getNotifications(this.state.page - 1);
                    return; 
                }
                this.getNotifications(this.state.page);
                return;
            }
            alert("Something wen't wrong!");
        })
    }

    handleChange = (ev, val) => {
        this.getNotifications(val);
        this.setState({ page: val });
    }

    static contextType = AuthContext;

    componentDidUpdate() {
        const { notification } = this.context;
        if (notification !== null) {
            const isNew = !this.state.notification.some(x => x.id === notification.id);
            if (isNew) {
                this.setState((prevState) => ({
                    notification: [notification, ...prevState.notification]
                }));
            }
        }
    }

    render() {
        return (
            <AuthContext.Consumer>
                {(prop) => {
                    const { dark } = prop;
                    
                    return (
                        <SideNavPost>
                            <Box sx={{ 
                                maxWidth: 800, 
                                margin: '0 auto', 
                                px: { xs: 2, md: 4 }, 
                                py: 6,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}>
                                
                                {/* Interactive Header */}
                                <Box sx={{ textAlign: 'center', mb: 6 }}>
                                    <Avatar sx={{ 
                                        m: '0 auto', mb: 2, 
                                        bgcolor: 'primary.main',
                                        width: 56, height: 56,
                                        boxShadow: '0 0 20px rgba(25, 118, 210, 0.5)'
                                    }}>
                                        <NotificationsActiveIcon />
                                    </Avatar>
                                    <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-2px' }}>
                                        Activity <span style={{ color: '#1976d2' }}>Feed</span>
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        You have {this.state.totalObjects} moments to catch up on.
                                    </Typography>
                                </Box>

                                {this.state.notification.length > 0 ? (
                                    <Box sx={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                                        gap: 3, 
                                        width: '100%' 
                                    }}>
                                        {this.state.notification.map((object, index) => {
                                            const isUnread = true; // Logic check would go here

                                            return (
                                                <Zoom in style={{ transitionDelay: `${index * 50}ms` }} key={index}>
                                                    <Paper
                                                        elevation={0}
                                                        sx={{
                                                            p: 0,
                                                            borderRadius: 5,
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                            bgcolor: dark ? '#1a1a1a' : '#fff',
                                                            border: '2px solid',
                                                            borderColor: isUnread ? 'primary.main' : 'divider',
                                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                            cursor: 'pointer',
                                                            '&:hover': {
                                                                transform: 'translateY(-8px) rotate(1deg)',
                                                                boxShadow: dark 
                                                                    ? '0 20px 40px rgba(0,0,0,0.6)' 
                                                                    : '0 20px 40px rgba(0,0,0,0.1)',
                                                            }
                                                        }}
                                                    >
                                                        {/* Status Accent Gradient */}
                                                        {isUnread && (
                                                            <Box sx={{ 
                                                                height: 4, 
                                                                width: '100%', 
                                                                background: 'linear-gradient(90deg, #1976d2, #64b5f6)' 
                                                            }} />
                                                        )}

                                                        <ListItem alignItems="flex-start" sx={{ p: 3 }}>
                                                            <ListItemAvatar>
                                                                <Avatar sx={{ 
                                                                    bgcolor: dark ? '#333' : '#f0f0f0', 
                                                                    color: 'primary.main',
                                                                    width: 50, height: 50
                                                                }}>
                                                                    <FeedIcon />
                                                                </Avatar>
                                                            </ListItemAvatar>

                                                            <ListItemText
                                                                primary={
                                                                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>
                                                                        {object.title}
                                                                    </Typography>
                                                                }
                                                                secondary={
                                                                    <>
                                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                                            {object.message}
                                                                        </Typography>
                                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                                            <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.6 }}>
                                                                                {this.services.aspDateHourMinutes(object.createdAt)}
                                                                            </Typography>
                                                                            <Tooltip title="Dismiss">
                                                                                <IconButton 
                                                                                    size="small" 
                                                                                    onClick={() => this.clearNotification(object.id)}
                                                                                    sx={{ bgcolor: 'action.hover' }}
                                                                                >
                                                                                    <ClearIcon fontSize="inherit" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Box>
                                                                    </>
                                                                }
                                                            />
                                                        </ListItem>
                                                    </Paper>
                                                </Zoom>
                                            )
                                        })}
                                    </Box>
                                ) : (
                                    <Typography variant="h5" color="text.disabled" sx={{ mt: 10 }}>
                                        Empty Inbox — Peace of mind!
                                    </Typography>
                                )}

                                {/* Floating Pagination */}
                                <Box sx={{ mt: 8 }}>
                                    <Pagination
                                        count={this.state.totalPages}
                                        page={this.state.page}
                                        onChange={this.handleChange}
                                        size="large"
                                        color="primary"
                                        sx={{
                                            '& .MuiPaginationItem-root': {
                                                borderRadius: 3,
                                                fontWeight: 700,
                                                '&.Mui-selected': { boxShadow: '0 4px 10px rgba(25,118,210,0.4)' }
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>
                        </SideNavPost>
                    )
                }}
            </AuthContext.Consumer>
        );
    }
}

export default Notification;