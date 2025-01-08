import { Box } from '@mui/material';

const Loading = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={200}
    >
      <img 
        src="https://github.com/Nischaya008/Image_hosting/blob/main/SSN.gif?raw=true"
        alt="Loading..."
        style={{
          width: '100px',  // Adjust size as needed
          height: 'auto'
        }}
      />
    </Box>
  );
};

export default Loading;