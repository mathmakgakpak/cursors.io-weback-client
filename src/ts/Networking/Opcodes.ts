enum Opcode { // OPeration code
    GET_ID = 0x00,
    UPDATE = 0x01, // cursors, clicks, remove objects, add or update objects, lines
    NEW_LEVEL = 0x04,
    PREDICTION_ERROR = 0x05 // Collision error / Teleport
}

export default Opcode;