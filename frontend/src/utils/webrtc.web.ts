
const RTCPeerConnection = (window as any).RTCPeerConnection || (window as any).webkitRTCPeerConnection || (window as any).mozRTCPeerConnection;
const RTCIceCandidate = (window as any).RTCIceCandidate;
const RTCSessionDescription = (window as any).RTCSessionDescription;
const mediaDevices = (navigator as any).mediaDevices;
const MediaStream = (window as any).MediaStream;

// Dummy RTCView for Web (We handle this in the component using <video>)
const RTCView = (props: any) => null;

export {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    mediaDevices,
    MediaStream,
};
